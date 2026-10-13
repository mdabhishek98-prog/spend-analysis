import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { confirmDelete } from '@/components/confirmDelete';
import { MonthNav } from '@/components/MonthNav';
import { Card, EmptyState, EntryRow, Icon, PageTitle, Screen, T } from '@/components/ui';
import { getCategory, Priority, PRIORITIES } from '@/lib/categories';
import { dayLabel, monthName, rupees } from '@/lib/format';
import { entriesFor } from '@/lib/insights';
import { Entry, useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/lib/theme';

type Filter = 'all' | Priority | 'income';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'need', label: 'Needs' },
  { key: 'want', label: 'Wants' },
  { key: 'saving', label: 'Savings' },
  { key: 'income', label: 'Income' },
];

export default function History() {
  const { entries, month, removeEntry, clearAll } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const days = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entriesFor(entries, month)
      .filter((e) => {
        if (filter === 'income') return e.type === 'income';
        if (filter !== 'all') return e.type === 'expense' && e.priority === filter;
        return true;
      })
      .filter((e) => !q || e.note.toLowerCase().includes(q) || getCategory(e.categoryId).name.toLowerCase().includes(q))
      .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
    const groups: { date: string; items: Entry[]; out: number }[] = [];
    for (const e of list) {
      let g = groups[groups.length - 1];
      if (!g || g.date !== e.date) groups.push((g = { date: e.date, items: [], out: 0 }));
      g.items.push(e);
      if (e.type === 'expense') g.out += e.amount;
    }
    return groups;
  }, [entries, month, query, filter]);

  return (
    <Screen header={<PageTitle title="History" subtitle={monthName(month, true)} right={<MonthNav />} />}>
      <View style={styles.search}>
        <Icon name="magnify" size={20} color={colors.ink3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes or categories"
          placeholderTextColor={colors.ink3}
          style={styles.searchInput}
          underlineColorAndroid="transparent"
          selectionColor={colors.brand}
          returnKeyType="search"
        />
        {query ? (
          <Pressable hitSlop={10} onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color={colors.ink3} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        {FILTERS.map((f) => {
          const on = f.key === filter;
          const tint = f.key === 'all' || f.key === 'income' ? null : PRIORITIES[f.key];
          return (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.filter, on && { backgroundColor: colors.ink }]}>
              {tint ? <View style={[styles.dot, { backgroundColor: tint.color }]} /> : null}
              <T w="bold" size={12} color={on ? '#fff' : colors.ink}>
                {f.label}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      {days.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon="text-search" title={query || filter !== 'all' ? 'No matches' : 'Nothing logged this month'} body={query || filter !== 'all' ? 'Try another search or filter.' : 'Tap + to add an expense.'} />
        </Card>
      ) : (
        days.map((d) => (
          <View key={d.date} style={{ marginBottom: 12 }}>
            <View style={styles.dayHeader}>
              <T w="bold" size={13} color={colors.ink2}>
                {dayLabel(d.date)}
              </T>
              {d.out > 0 ? (
                <T w="semibold" size={12} color={colors.ink3}>
                  {rupees(d.out)} spent
                </T>
              ) : null}
            </View>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {d.items.map((e, i) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  showDate={false}
                  last={i === d.items.length - 1}
                  onPress={() => router.push({ pathname: '/add', params: { id: e.id } })}
                  onLongPress={() => confirmDelete(e, removeEntry)}
                />
              ))}
            </Card>
          </View>
        ))
      )}
      {days.length > 0 ? (
        <T size={12} color={colors.ink3} style={{ textAlign: 'center', marginTop: 4 }}>
          Tap to edit · long-press to delete
        </T>
      ) : null}
      {entries.length > 0 ? (
        <Pressable
          hitSlop={8}
          style={{ alignSelf: 'center', marginTop: 24 }}
          onPress={() =>
            Alert.alert('Clear all data?', 'This deletes every entry and budget on this phone. It cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear all', style: 'destructive', onPress: clearAll },
            ])
          }
        >
          <T w="bold" size={13} color={colors.danger}>
            Clear all data
          </T>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink, paddingVertical: 0 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
});
