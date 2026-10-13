import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonthNav } from '@/components/MonthNav';
import { Bar, Card, EmptyState, Icon, IconTile, PageTitle, Screen, T } from '@/components/ui';
import { CATEGORIES, getCategory, PRIORITIES } from '@/lib/categories';
import { daysLeft, monthName, rupees } from '@/lib/format';
import { summarize } from '@/lib/insights';
import { useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/lib/theme';

type Editing = { kind: 'month' } | { kind: 'category'; id?: string } | null;

export default function Budgets() {
  const { entries, month, budgets, monthLimit, setBudget, setMonthLimit } = useStore();
  const s = useMemo(() => summarize(entries, month), [entries, month]);
  const [editing, setEditing] = useState<Editing>(null);
  const days = daysLeft(month);

  const rows = Object.entries(budgets)
    .map(([id, limit]) => ({ id, limit, spent: s.byCategory.find((c) => c.id === id)?.amount ?? 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  const monthOver = monthLimit > 0 && s.spent > monthLimit;
  const remaining = monthLimit - s.spent;

  return (
    <Screen
      header={
        <PageTitle
          title="Budgets"
          subtitle={`${monthName(month)}${days ? ` · ${days} ${days === 1 ? 'day' : 'days'} left` : ''}`}
          right={<MonthNav />}
        />
      }
    >
      <Card>
        <View style={styles.rowBetween}>
          <T size={12} color={colors.ink2}>
            Monthly limit
          </T>
          <Pressable hitSlop={10} onPress={() => setEditing({ kind: 'month' })}>
            <T w="bold" size={13} color={colors.brand}>
              {monthLimit ? 'Edit' : 'Set limit'}
            </T>
          </Pressable>
        </View>
        <T w="heavy" size={26} style={{ letterSpacing: -0.6, marginTop: 2 }}>
          {rupees(s.spent)}
          {monthLimit ? (
            <T w="medium" size={14} color={colors.ink2}>
              {'  '}/ {rupees(monthLimit)}
            </T>
          ) : null}
        </T>
        {monthLimit ? (
          <>
            <View style={{ marginTop: 10 }}>
              <Bar height={10} segments={[{ value: s.spent / monthLimit, color: monthOver ? colors.danger : colors.ink }]} />
            </View>
            <T size={12} color={monthOver ? colors.danger : colors.ink2} style={{ marginTop: 8 }}>
              {monthOver
                ? `${rupees(-remaining)} over your limit`
                : `${rupees(remaining)} left${days ? ` · about ${rupees(Math.floor(remaining / days))} a day` : ''}`}
            </T>
          </>
        ) : (
          <T size={12} color={colors.ink2} style={{ marginTop: 6 }}>
            {s.income ? `Tip: 80% of income is ${rupees(Math.round(s.income * 0.8))}, which leaves 20% to save.` : 'Set a cap for total spending this month.'}
          </T>
        )}
      </Card>

      <Card padded={false} style={{ marginTop: 12, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <EmptyState icon="target" title="Add your first budget" body="Cap the categories you overspend on, like eating out or shopping." />
        ) : (
          rows.map((r, i) => {
            const cat = getCategory(r.id);
            const p = PRIORITIES[cat.priority];
            const over = r.spent > r.limit;
            return (
              <Pressable
                key={r.id}
                onPress={() => setEditing({ kind: 'category', id: r.id })}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                style={[styles.budgetRow, i < rows.length - 1 && styles.rowBorder]}
              >
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <IconTile name={cat.icon} color={p.text} bg={p.bg} size={32} />
                    <T w="bold" size={14} numberOfLines={1}>
                      {cat.name}
                    </T>
                  </View>
                  <T size={13} color={colors.ink2}>
                    <T w="bold" size={14} color={over ? colors.danger : colors.ink}>
                      {rupees(r.spent)}
                    </T>{' '}
                    / {rupees(r.limit).replace('₹', '')}
                  </T>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Bar segments={[{ value: r.spent / r.limit, color: over ? colors.danger : p.color }]} />
                </View>
                {over ? (
                  <T w="semibold" size={12} color={colors.danger} style={{ marginTop: 6 }}>
                    {rupees(r.spent - r.limit)} over
                  </T>
                ) : null}
              </Pressable>
            );
          })
        )}
      </Card>

      <Pressable onPress={() => setEditing({ kind: 'category' })} style={styles.addBtn}>
        <Icon name="plus" size={18} color={colors.brand} />
        <T w="bold" size={14} color={colors.brand}>
          Add a budget
        </T>
      </Pressable>

      <BudgetSheet
        editing={editing}
        budgets={budgets}
        monthLimit={monthLimit}
        onClose={() => setEditing(null)}
        onSave={(id, amount) => (id ? setBudget(id, amount) : setMonthLimit(amount))}
      />
    </Screen>
  );
}

function BudgetSheet({ editing, budgets, monthLimit, onClose, onSave }: {
  editing: Editing;
  budgets: Record<string, number>;
  monthLimit: number;
  onClose: () => void;
  onSave: (categoryId: string | undefined, amount: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [catId, setCatId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const isMonth = editing?.kind === 'month';
  const fixedCat = editing?.kind === 'category' ? editing.id : undefined;
  const selected = fixedCat ?? catId;
  const existing = isMonth ? monthLimit : selected ? budgets[selected] : 0;

  const onShow = () => {
    setCatId(undefined);
    setError('');
    setAmount(existing ? String(existing) : '');
  };

  const save = () => {
    if (!isMonth && !selected) return setError('Pick a category first');
    const n = Number(amount);
    if (!(n > 0)) return setError('Enter an amount');
    onSave(isMonth ? undefined : selected, Math.round(n));
    onClose();
  };

  const remove = () => {
    onSave(isMonth ? undefined : selected, 0);
    onClose();
  };

  const choices = CATEGORIES.filter((c) => c.type === 'expense' && c.priority !== 'saving');

  return (
    <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={onClose} onShow={onShow} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <T w="heavy" size={18}>
            {isMonth ? 'Monthly limit' : fixedCat ? `${getCategory(fixedCat).name} budget` : 'New budget'}
          </T>

          {!isMonth && !fixedCat && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
              {choices.map((c) => {
                const on = c.id === catId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setCatId(c.id);
                      setError('');
                      setAmount(budgets[c.id] ? String(budgets[c.id]) : '');
                    }}
                    style={[styles.catPill, on && { backgroundColor: colors.ink }]}
                  >
                    <Icon name={c.icon} size={16} color={on ? '#fff' : colors.ink} />
                    <T w="bold" size={12} color={on ? '#fff' : colors.ink}>
                      {c.name}
                    </T>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.inputRow}>
            <T w="heavy" size={28} color={colors.ink2}>
              ₹
            </T>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.ink3}
              style={styles.input}
              autoFocus
              selectionColor={colors.brand}
              underlineColorAndroid="transparent"
              accessibilityLabel="Budget amount"
            />
          </View>
          {error ? (
            <T size={13} color={colors.danger} style={{ marginTop: 6 }}>
              {error}
            </T>
          ) : null}

          <Pressable onPress={save} style={styles.saveBtn}>
            <T w="bold" size={15} color="#fff">
              Save
            </T>
          </Pressable>
          {existing ? (
            <Pressable onPress={remove} style={{ alignSelf: 'center', marginTop: 14 }} hitSlop={8}>
              <T w="bold" size={13} color={colors.danger}>
                Remove {isMonth ? 'limit' : 'budget'}
              </T>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetRow: { padding: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  scrim: { flex: 1, backgroundColor: 'rgba(21,23,28,0.4)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: colors.line, marginTop: 8 },
  input: { flex: 1, fontFamily: fonts.heavy, fontSize: 32, color: colors.ink, paddingVertical: 8, marginLeft: 6, includeFontPadding: false },
  saveBtn: { backgroundColor: colors.brand, borderRadius: radius.md, alignItems: 'center', paddingVertical: 15, marginTop: 20 },
});
