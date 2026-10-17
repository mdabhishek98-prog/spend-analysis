import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { EntryType, PayMode, Priority } from './categories';
import { currentMonth } from './format';

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
  const clearAll = useCallback(() => dispatch({ type: 'replaceAll', entries: [], budgets: {}, monthLimit: 0 }), []);

  const value = useMemo(
    () => ({ ...state, saveEntry, removeEntry, setBudget, setMonthLimit, setMonth, clearAll }),
    [state, saveEntry, removeEntry, setBudget, setMonthLimit, setMonth, clearAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
