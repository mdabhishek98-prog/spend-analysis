import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { EntryType, PayMode, Priority } from './categories';
import { currentMonth, shiftDate, todayISO } from './format';

export type Entry = {
  id: string;
  type: EntryType;
  amount: number;
  categoryId: string;
  priority: Priority;
  note: string;
  date: string; // YYYY-MM-DD
  mode: PayMode;
  createdAt: number;
};

type State = {
  ready: boolean;
  entries: Entry[];
  budgets: Record<string, number>; // categoryId -> monthly limit
  monthLimit: number; // overall monthly spending limit, 0 = not set
  month: string; // YYYY-MM being viewed
};

type Action =
  | { type: 'hydrate'; data: Partial<State> }
  | { type: 'upsert'; entry: Entry }
  | { type: 'remove'; id: string }
  | { type: 'setBudget'; categoryId: string; amount: number }
  | { type: 'setMonthLimit'; amount: number }
  | { type: 'setMonth'; month: string }
  | { type: 'replaceAll'; entries: Entry[]; budgets: Record<string, number>; monthLimit: number };

const STORAGE_KEY = 'spend-analysis/v1';

const initial: State = { ready: false, entries: [], budgets: {}, monthLimit: 0, month: currentMonth() };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.data, ready: true };
    case 'upsert': {
      const others = state.entries.filter((e) => e.id !== action.entry.id);
      return { ...state, entries: [...others, action.entry] };
    }
    case 'remove':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case 'setBudget': {
      const budgets = { ...state.budgets };
      if (action.amount > 0) budgets[action.categoryId] = action.amount;
      else delete budgets[action.categoryId];
      return { ...state, budgets };
    }
    case 'setMonthLimit':
      return { ...state, monthLimit: Math.max(0, action.amount) };
    case 'setMonth':
      return { ...state, month: action.month };
    case 'replaceAll':
      return { ...state, entries: action.entries, budgets: action.budgets, monthLimit: action.monthLimit };
  }
}

type Store = State & {
  saveEntry: (e: Omit<Entry, 'id' | 'createdAt'> & { id?: string }) => void;
  removeEntry: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  setMonthLimit: (amount: number) => void;
  setMonth: (month: string) => void;
  loadSample: () => void;
  clearAll: () => void;
};

const Ctx = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const data = raw ? JSON.parse(raw) : {};
        dispatch({ type: 'hydrate', data: { entries: data.entries ?? [], budgets: data.budgets ?? {}, monthLimit: data.monthLimit ?? 0 } });
      })
      .catch(() => dispatch({ type: 'hydrate', data: {} }))
      .finally(() => (hydrated.current = true));
  }, []);

  const { entries, budgets, monthLimit } = state;
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, budgets, monthLimit })).catch(() => {});
  }, [entries, budgets, monthLimit]);

  const saveEntry = useCallback<Store['saveEntry']>((e) => {
    dispatch({ type: 'upsert', entry: { ...e, id: e.id ?? newId(), createdAt: Date.now() } });
  }, []);
  const removeEntry = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const setBudget = useCallback((categoryId: string, amount: number) => dispatch({ type: 'setBudget', categoryId, amount }), []);
  const setMonthLimit = useCallback((amount: number) => dispatch({ type: 'setMonthLimit', amount }), []);
  const setMonth = useCallback((month: string) => dispatch({ type: 'setMonth', month }), []);
  const loadSample = useCallback(() => dispatch({ type: 'replaceAll', ...sampleData() }), []);
  const clearAll = useCallback(() => dispatch({ type: 'replaceAll', entries: [], budgets: {}, monthLimit: 0 }), []);

  const value = useMemo(
    () => ({ ...state, saveEntry, removeEntry, setBudget, setMonthLimit, setMonth, loadSample, clearAll }),
    [state, saveEntry, removeEntry, setBudget, setMonthLimit, setMonth, loadSample, clearAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

// Two months of believable household entries so Insights has something to say.
function sampleData() {
  const t = todayISO();
  const entries: Entry[] = [];
  let n = 0;
  const add = (daysAgo: number, type: EntryType, categoryId: string, amount: number, priority: Priority, note: string, mode: PayMode = 'upi') =>
    entries.push({ id: `s${n++}`, type, amount, categoryId, priority, note, date: shiftDate(t, -daysAgo), mode, createdAt: n });

  for (const off of [0, 30]) {
    add(off + 11, 'income', 'salary', 68000, 'need', 'Monthly salary', 'card');
    add(off + 10, 'expense', 'rent', 18000, 'need', 'House rent', 'upi');
    add(off + 10, 'expense', 'emi', 7500, 'need', 'Bike EMI', 'card');
    add(off + 10, 'expense', 'investment', 5000, 'saving', 'Index fund SIP', 'upi');
    add(off + 9, 'expense', 'groceries', 4200, 'need', 'Monthly groceries', 'upi');
    add(off + 8, 'expense', 'bills', 1850, 'need', 'Electricity bill', 'upi');
    add(off + 8, 'expense', 'phone', 799, 'need', 'Mobile recharge', 'upi');
    add(off + 7, 'expense', 'eating-out', off ? 1200 : 1850, 'want', 'Dinner with friends', 'card');
    add(off + 6, 'expense', 'transport', 650, 'need', 'Petrol', 'upi');
    add(off + 5, 'expense', 'health', 540, 'need', 'Medicines', 'cash');
    add(off + 4, 'expense', 'shopping', off ? 1800 : 3499, 'want', 'Sneakers on sale', 'card');
    add(off + 4, 'expense', 'eating-out', 380, 'want', 'Swiggy', 'upi');
    add(off + 3, 'expense', 'entertainment', 649, 'want', 'Movie night', 'upi');
    add(off + 3, 'expense', 'household', 1250, 'need', 'Cleaning supplies', 'cash');
    add(off + 2, 'expense', 'eating-out', 240, 'want', 'Chai and snacks', 'cash');
    add(off + 2, 'expense', 'transport', 180, 'need', 'Auto', 'cash');
    add(off + 1, 'expense', 'eating-out', 420, 'want', 'Zomato', 'upi');
    add(off + 1, 'expense', 'groceries', 360, 'need', 'Milk and veggies', 'cash');
    add(off + 0, 'expense', 'education', 1500, 'need', 'Tuition', 'upi');
  }
  add(12, 'income', 'freelance', 5000, 'need', 'Logo design project', 'upi');
  add(6, 'expense', 'gifts', 2100, 'want', 'Diwali sweets', 'cash');
  return {
    entries,
    budgets: { 'eating-out': 2000, shopping: 2500, groceries: 5000, entertainment: 1000 },
    monthLimit: 50000,
  };
}
