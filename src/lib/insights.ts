import { getCategory, IconName, PayMode, Priority, PRIORITIES } from './categories';
import { currentMonth, daysLeft, monthKey, rupees, shiftMonth } from './format';
import type { Entry } from './store';

export type MonthSummary = {
  income: number;
  need: number;
  want: number;
  invested: number; // money moved to savings (SIP, FD...)
  spent: number; // need + want — what actually left your life
  left: number; // income − spent − invested
  saved: number; // income − spent: invested plus whatever is still unspent
  byCategory: { id: string; amount: number; count: number; priority: Priority }[];
  byMode: Record<PayMode, number>;
  count: number;
};

export const entriesFor = (entries: Entry[], month: string) => entries.filter((e) => monthKey(e.date) === month);

export function summarize(entries: Entry[], month: string): MonthSummary {
  const byMode: Record<PayMode, number> = { upi: 0, cash: 0, card: 0 };
  const cat = new Map<string, { amount: number; count: number; priority: Priority }>();
  const p: Record<Priority, number> = { need: 0, want: 0, saving: 0 };
  let income = 0;
  const list = entriesFor(entries, month);
  for (const e of list) {
    if (e.type === 'income') {
      income += e.amount;
      continue;
    }
    p[e.priority] += e.amount;
    byMode[e.mode] += e.amount;
    const c = cat.get(e.categoryId) ?? { amount: 0, count: 0, priority: e.priority };
    c.amount += e.amount;
    c.count += 1;
    cat.set(e.categoryId, c);
  }
  const spent = p.need + p.want;
  return {
    income,
    need: p.need,
    want: p.want,
    invested: p.saving,
    spent,
    left: income - spent - p.saving,
    saved: income - spent,
    byCategory: [...cat.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.amount - a.amount),
    byMode,
    count: list.length,
  };
}

/** Share of income per priority, against the 50/30/20 rule. */
export function prioritySplit(s: MonthSummary) {
  const base = s.income || s.spent + s.invested || 1;
  const row = (key: Priority, amount: number) => {
    const pct = amount / base;
    const target = PRIORITIES[key].target;
    // Judge on the rounded percent the user sees, so "50% / max 50%" never shows as a miss.
    const shown = Math.round(pct * 100);
    return { key, amount, pct, target, ok: key === 'saving' ? shown >= target * 100 : shown <= target * 100 };
  };
  return [row('need', s.need), row('want', s.want), row('saving', Math.max(0, s.income ? s.saved : s.invested))];
}

/** What can still be spent per day without breaking the limit or the 20% savings goal. */
export function safeToSpend(s: MonthSummary, month: string, monthLimit: number): { perDay: number; remaining: number; days: number } | null {
  const days = daysLeft(month);
  if (days === 0) return null;
  const cap = monthLimit > 0 ? monthLimit : s.income * 0.8;
  if (cap <= 0) return null;
  const remaining = Math.max(0, cap - s.spent);
  return { perDay: Math.floor(remaining / days), remaining, days };
}

export function overBudget(s: MonthSummary, budgets: Record<string, number>) {
  return Object.entries(budgets)
    .map(([id, limit]) => ({ id, limit, spent: s.byCategory.find((c) => c.id === id)?.amount ?? 0 }))
    .filter((b) => b.spent > b.limit)
    .sort((a, b) => b.spent - b.limit - (a.spent - a.limit));
}

export type Advice = { tone: 'good' | 'warn' | 'info'; icon: IconName; title: string; body: string };

export function adviceFor(entries: Entry[], month: string, budgets: Record<string, number>, monthLimit: number): Advice[] {
  const s = summarize(entries, month);
  const prev = summarize(entries, shiftMonth(month, -1));
  const out: Advice[] = [];
  if (s.count === 0) {
    return [{ tone: 'info', icon: 'pencil-outline', title: 'Nothing logged yet', body: 'Add your income and a few expenses, and tips will show up here.' }];
  }

  if (s.income === 0) {
    out.push({ tone: 'info', icon: 'briefcase-outline', title: 'Add your income', body: 'Log your salary so we can tell how much you are saving.' });
  } else {
    const rate = s.saved / s.income;
    if (s.saved < 0) {
      out.push({ tone: 'warn', icon: 'alert-outline', title: `Overspent by ${rupees(-s.saved)}`, body: 'You spent more than you earned this month. Cut Wants first.' });
    } else if (rate < 0.2) {
      const gap = Math.round(s.income * 0.2 - s.saved);
      out.push({ tone: 'warn', icon: 'piggy-bank-outline', title: `Saving only ${Math.round(rate * 100)}%`, body: `Aim for 20%. Spend ${rupees(gap)} less this month to get there.` });
    } else if (s.left > 1000 && month === currentMonth()) {
      const sts = safeToSpend(s, month, monthLimit);
      const move = Math.floor((s.left * 0.7) / 500) * 500;
      if (move >= 1000) {
        out.push({
          tone: 'good',
          icon: 'piggy-bank-outline',
          title: `Move ${rupees(move)} to savings`,
          body: sts ? `You'll still have about ${rupees(Math.floor((s.left - move) / sts.days))} a day for the rest of the month.` : 'Unspent money in a bank account does not grow.',
        });
      }
    } else {
      out.push({ tone: 'good', icon: 'check-circle-outline', title: `Saving ${Math.round(rate * 100)}% of income`, body: 'You are above the 20% goal. Keep it up.' });
    }

    if (Math.round((s.want / s.income) * 100) > 30) {
      out.push({ tone: 'warn', icon: 'shopping-outline', title: `Wants are ${Math.round((s.want / s.income) * 100)}% of income`, body: `Keep them under 30%. That means ${rupees(s.want - s.income * 0.3)} less.` });
    }
    if (Math.round((s.need / s.income) * 100) > 50) {
      out.push({ tone: 'info', icon: 'home-outline', title: `Needs are ${Math.round((s.need / s.income) * 100)}% of income`, body: 'Rent and EMIs are heavy. Over time, try to bring fixed costs under 50%.' });
    }
  }

  for (const b of overBudget(s, budgets).slice(0, 2)) {
    out.push({ tone: 'warn', icon: getCategory(b.id).icon, title: `${getCategory(b.id).name} is ${rupees(b.spent - b.limit)} over`, body: `Budget was ${rupees(b.limit)}. You've spent ${rupees(b.spent)}.` });
  }

  let worst: { id: string; diff: number } | null = null;
  for (const c of s.byCategory) {
    if (c.priority === 'saving') continue;
    const before = prev.byCategory.find((p) => p.id === c.id)?.amount ?? 0;
    const diff = c.amount - before;
    if (before > 0 && diff >= 500 && (!worst || diff > worst.diff)) worst = { id: c.id, diff };
  }
  if (worst) {
    out.push({ tone: 'warn', icon: 'trending-up', title: `${getCategory(worst.id).name} is up ${rupees(worst.diff)}`, body: `Compared with ${rupees(prev.byCategory.find((p) => p.id === worst!.id)!.amount)} last month.` });
  }

  const small = entriesFor(entries, month).filter((e) => e.type === 'expense' && e.priority !== 'saving' && e.amount < 500);
  if (small.length >= 4) {
    const sum = small.reduce((a, e) => a + e.amount, 0);
    out.push({ tone: 'info', icon: 'circle-multiple-outline', title: `${small.length} small spends added up to ${rupees(sum)}`, body: 'Each was under ₹500. Small spends are the easiest to cut.' });
  }

  if (s.byMode.cash > s.spent * 0.4) {
    out.push({ tone: 'info', icon: 'cash', title: 'Lots of cash spending', body: 'Cash is easy to lose track of. Log it as soon as you pay.' });
  }
  return out;
}
