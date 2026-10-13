import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmDelete } from '@/components/confirmDelete';
import { Icon, T } from '@/components/ui';
import { CATEGORIES, EntryType, getCategory, PAY_MODES, PayMode, PRIORITIES, Priority } from '@/lib/categories';
import { dayLabel, shiftDate, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/lib/theme';

// Fall back to Home when the screen was opened directly (deep link) and has nothing to go back to.
const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function AddEntry() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { entries, saveEntry, removeEntry } = useStore();
  const existing = useMemo(() => entries.find((e) => e.id === id), [entries, id]);

  const [type, setType] = useState<EntryType>(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? 'groceries');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'need');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [mode, setMode] = useState<PayMode>(existing?.mode ?? 'upi');
  const [error, setError] = useState('');

  const today = todayISO();
  const cats = CATEGORIES.filter((c) => c.type === type);
  const value = Number(amount);
  const suggested = getCategory(categoryId).priority;

  const switchType = (t: EntryType) => {
    if (t === type) return;
    setType(t);
    const first = CATEGORIES.find((c) => c.type === t)!;
    setCategoryId(first.id);
    setPriority(first.priority);
  };

  const pickCategory = (cid: string) => {
    setCategoryId(cid);
    setPriority(getCategory(cid).priority);
    Haptics.selectionAsync().catch(() => {});
  };

  const save = () => {
    if (!(value > 0)) {
      setError('Enter an amount first');
      return;
    }
    saveEntry({ id: existing?.id, type, amount: Math.round(value * 100) / 100, categoryId, priority: type === 'income' ? 'need' : priority, note: note.trim(), date, mode });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    close();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => close()} style={styles.topBtn}>
          <Icon name="close" size={24} />
        </Pressable>
        <View style={styles.segment}>
          {(['expense', 'income'] as const).map((t) => (
            <Pressable key={t} onPress={() => switchType(t)} style={[styles.segBtn, type === t && styles.segOn]}>
              <T w="bold" size={13} color={type === t ? colors.ink : colors.ink3}>
                {t === 'expense' ? 'Expense' : 'Income'}
              </T>
            </Pressable>
          ))}
        </View>
        {existing ? (
          <Pressable accessibilityLabel="Delete entry" hitSlop={12} onPress={() => confirmDelete(existing, removeEntry, () => close())} style={styles.topBtn}>
            <Icon name="trash-can-outline" size={22} color={colors.danger} />
          </Pressable>
        ) : (
          <View style={styles.topBtn} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={styles.amountRow}>
            <T w="heavy" size={40} color={value > 0 ? colors.ink : colors.ink3}>
              ₹
            </T>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                const clean = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                setAmount(clean);
                if (error) setError('');
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.ink3}
              style={[styles.amountInput, { width: Math.max(1, amount.length) * 30 + 16 }]}
              autoFocus={!existing}
              selectionColor={colors.brand}
              underlineColorAndroid="transparent"
              accessibilityLabel="Amount"
            />
          </View>
          {error ? (
            <T size={13} color={colors.danger} style={{ textAlign: 'center' }}>
              {error}
            </T>
          ) : null}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={type === 'expense' ? 'Zomato dinner' : 'October salary'}
            placeholderTextColor={colors.ink3}
            style={styles.noteInput}
            maxLength={60}
            selectionColor={colors.brand}
            underlineColorAndroid="transparent"
            accessibilityLabel="Note"
          />

          <T w="bold" size={14} style={styles.label}>
            Category
          </T>
          <View style={styles.grid}>
            {cats.map((c) => {
              const on = c.id === categoryId;
              return (
                <Pressable key={c.id} onPress={() => pickCategory(c.id)} style={styles.gridItem} accessibilityState={{ selected: on }}>
                  <View style={[styles.catTile, on && { backgroundColor: colors.ink }]}>
                    <Icon name={c.icon} size={22} color={on ? '#fff' : colors.ink} />
                  </View>
                  <T w={on ? 'bold' : 'medium'} size={11} numberOfLines={1} style={{ marginTop: 5 }} color={on ? colors.ink : colors.ink2}>
                    {c.name}
                  </T>
                </Pressable>
              );
            })}
          </View>

          {type === 'expense' && (
            <>
              <View style={[styles.labelRow]}>
                <T w="bold" size={14}>
                  Priority
                </T>
                <T size={12} color={colors.ink2}>
                  Suggested: {PRIORITIES[suggested].label}
                </T>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.keys(PRIORITIES) as Priority[]).map((k) => {
                  const p = PRIORITIES[k];
                  const on = k === priority;
                  return (
                    <Pressable key={k} onPress={() => setPriority(k)} style={[styles.prio, on && { borderColor: p.color, backgroundColor: p.bg }]}>
                      <T w="bold" size={14} color={p.text}>
                        {p.label}
                      </T>
                      <T size={11} color={on ? p.text : colors.ink2} style={{ marginTop: 2 }}>
                        {p.hint}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <T w="bold" size={14} style={styles.label}>
            Date
          </T>
          <View style={styles.pillRow}>
            <Pill label="Today" icon="calendar-today" on={date === today} onPress={() => setDate(today)} />
            <Pill label="Yesterday" on={date === shiftDate(today, -1)} onPress={() => setDate(shiftDate(today, -1))} />
            <View style={styles.dateStepper}>
              <Pressable hitSlop={8} accessibilityLabel="Previous day" onPress={() => setDate(shiftDate(date, -1))}>
                <Icon name="chevron-left" size={20} />
              </Pressable>
              <T w="semibold" size={12} style={{ minWidth: 84, textAlign: 'center' }}>
                {dayLabel(date)}
              </T>
              <Pressable hitSlop={8} accessibilityLabel="Next day" onPress={() => date < today && setDate(shiftDate(date, 1))}>
                <Icon name="chevron-right" size={20} color={date < today ? colors.ink : colors.line} />
              </Pressable>
            </View>
          </View>

          <T w="bold" size={14} style={styles.label}>
            {type === 'expense' ? 'Paid with' : 'Received in'}
          </T>
          <View style={styles.pillRow}>
            {(Object.keys(PAY_MODES) as PayMode[]).map((m) => (
              <Pill key={m} label={PAY_MODES[m].label} icon={PAY_MODES[m].icon} on={mode === m} onPress={() => setMode(m)} />
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={save} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
            <T w="bold" size={15} color="#fff">
              {existing ? 'Save changes' : type === 'expense' ? 'Save expense' : 'Save income'}
            </T>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Pill({ label, icon, on, onPress }: { label: string; icon?: Parameters<typeof Icon>[0]['name']; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, on && { backgroundColor: colors.ink }]}>
      {icon ? <Icon name={icon} size={15} color={on ? '#fff' : colors.ink} /> : null}
      <T w="bold" size={12} color={on ? '#fff' : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 14, padding: 3 },
  segBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 11 },
  segOn: { backgroundColor: colors.card, elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  amountInput: {
    fontFamily: fonts.heavy,
    fontSize: 48,
    color: colors.ink,
    paddingVertical: 0,
    marginLeft: 2,
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  noteInput: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  label: { marginTop: 22, marginBottom: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  gridItem: { width: '25%', alignItems: 'center', paddingHorizontal: 2 },
  catTile: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  prio: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  dateStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  footer: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.card },
  saveBtn: { backgroundColor: colors.brand, borderRadius: radius.md, alignItems: 'center', paddingVertical: 16 },
});
