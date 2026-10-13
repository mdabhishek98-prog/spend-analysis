import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from './theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type Priority = 'need' | 'want' | 'saving';
export type EntryType = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  type: EntryType;
  priority: Priority; // suggested priority for expenses
};

export const PRIORITIES: Record<Priority, { label: string; hint: string; color: string; text: string; bg: string; target: number }> = {
  need: { label: 'Need', hint: 'Must pay', color: colors.need, text: colors.need, bg: colors.needBg, target: 0.5 },
  want: { label: 'Want', hint: 'Nice to have', color: colors.want, text: colors.wantText, bg: colors.wantBg, target: 0.3 },
  saving: { label: 'Saving', hint: 'SIP, FD, gold', color: colors.save, text: colors.save, bg: colors.saveBg, target: 0.2 },
};

export const CATEGORIES: Category[] = [
  { id: 'rent', name: 'Rent', icon: 'home-outline', type: 'expense', priority: 'need' },
  { id: 'groceries', name: 'Groceries', icon: 'basket-outline', type: 'expense', priority: 'need' },
  { id: 'eating-out', name: 'Eating out', icon: 'silverware-fork-knife', type: 'expense', priority: 'want' },
  { id: 'bills', name: 'Bills', icon: 'lightning-bolt-outline', type: 'expense', priority: 'need' },
  { id: 'transport', name: 'Transport', icon: 'car-outline', type: 'expense', priority: 'need' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-outline', type: 'expense', priority: 'want' },
  { id: 'health', name: 'Health', icon: 'heart-pulse', type: 'expense', priority: 'need' },
  { id: 'education', name: 'Education', icon: 'school-outline', type: 'expense', priority: 'need' },
  { id: 'emi', name: 'Loan / EMI', icon: 'bank-outline', type: 'expense', priority: 'need' },
  { id: 'phone', name: 'Phone', icon: 'cellphone', type: 'expense', priority: 'need' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-check-outline', type: 'expense', priority: 'need' },
  { id: 'household', name: 'Household', icon: 'sofa-outline', type: 'expense', priority: 'need' },
  { id: 'entertainment', name: 'Fun', icon: 'movie-open-outline', type: 'expense', priority: 'want' },
  { id: 'travel', name: 'Travel', icon: 'airplane', type: 'expense', priority: 'want' },
  { id: 'gifts', name: 'Gifts', icon: 'gift-outline', type: 'expense', priority: 'want' },
  { id: 'personal', name: 'Personal', icon: 'face-man-shimmer-outline', type: 'expense', priority: 'want' },
  { id: 'investment', name: 'Investments', icon: 'chart-line', type: 'expense', priority: 'saving' },
  { id: 'emergency', name: 'Emergency', icon: 'piggy-bank-outline', type: 'expense', priority: 'saving' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal', type: 'expense', priority: 'want' },

  { id: 'salary', name: 'Salary', icon: 'briefcase-outline', type: 'income', priority: 'need' },
  { id: 'business', name: 'Business', icon: 'storefront-outline', type: 'income', priority: 'need' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', type: 'income', priority: 'need' },
  { id: 'interest', name: 'Interest', icon: 'percent-outline', type: 'income', priority: 'need' },
  { id: 'rent-in', name: 'Rent received', icon: 'key-outline', type: 'income', priority: 'need' },
  { id: 'other-in', name: 'Other income', icon: 'cash-plus', type: 'income', priority: 'need' },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));
const fallback = byId.get('other')!;
export const getCategory = (id: string): Category => byId.get(id) ?? fallback;

export type PayMode = 'upi' | 'cash' | 'card';
export const PAY_MODES: Record<PayMode, { label: string; icon: IconName }> = {
  upi: { label: 'UPI', icon: 'qrcode' },
  cash: { label: 'Cash', icon: 'cash' },
  card: { label: 'Card', icon: 'credit-card-outline' },
};
