import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { confirmDelete } from '@/components/confirmDelete';
import { MonthNav } from '@/components/MonthNav';
import { Bar, Card, EmptyState, EntryRow, Icon, Screen, SectionHeader, T } from '@/components/ui';
import { getCategory } from '@/lib/categories';
import { greeting, monthName, rupees } from '@/lib/format';
import { entriesFor, overBudget, safeToSpend, summarize } from '@/lib/insights';
import { useStore } from '@/lib/store';
import { colors, radius } from '@/lib/theme';

export default function Home() {
  const { entries, month, budgets, monthLimit, removeEntry, loadSample } = useStore();
  const s = useMemo(() => summarize(entries, month), [entries, month]);
  const sts = safeToSpend(s, month, monthLimit);
  const over = overBudget(s, budgets)[0];
  const recent = useMemo(
    () => entriesFor(entries, month).sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)).slice(0, 5),
    [entries, month],
  );

  const base = s.income || s.spent + s.invested || 1;
  const share = (n: number) => Math.round((n / base) * 100);
  const savedShare = s.income ? Math.max(0, s.saved) / base : s.invested / base;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <T size={13} color={colors.ink2}>
            {greeting()}
          </T>
          <T w="heavy" size={24} style={{ letterSpacing: -0.5 }}>
            {monthName(month)}
          </T>
        </View>
        <MonthNav />
      </View>

      <View style={styles.hero}>
        <T size={12} color={colors.heroMuted}>
          Spent this month
        </T>
        <T w="heavy" size={36} color="#fff" style={{ letterSpacing: -1.2, marginTop: 2 }}>
          {rupees(s.spent)}
        </T>
        <T size={12} color={colors.heroMuted} style={{ marginTop: 2 }}>
          {s.income ? (
            <>
              of {rupees(s.income)} income ·{' '}
              <T size={12} color={s.left >= 0 ? '#8CE0BC' : '#FF9A9D'}>
                {s.left >= 0 ? `${rupees(s.left)} left` : `${rupees(-s.left)} over`}
              </T>
            </>
          ) : (
            'Add your income to see what is left'
          )}
        </T>
        <View style={{ marginTop: 14, marginBottom: 10 }}>
          <Bar
            height={10}
            track={colors.heroTrack}
            segments={[
              { value: s.need / base, color: colors.need },
              { value: s.want / base, color: colors.want },
              { value: Math.max(0, 1 - s.need / base - s.want / base - savedShare), color: colors.heroTrack },
              { value: savedShare, color: colors.save },
            ]}
          />
        </View>
        <View style={styles.legend}>
          <Legend color={colors.need} label={`Needs ${share(s.need)}%`} />
          <Legend color={colors.want} label={`Wants ${share(s.want)}%`} />
          <Legend color={colors.save} label={`Saved ${Math.round(savedShare * 100)}%`} />
        </View>
      </View>

      <View style={styles.miniRow}>
        <Card style={styles.mini}>
          <T size={12} color={colors.ink2}>
            {sts ? 'Safe to spend today' : 'Saved this month'}
          </T>
          <T w="heavy" size={20} style={{ marginTop: 4 }}>
            {sts ? rupees(sts.perDay) : rupees(Math.max(0, s.saved))}
          </T>
        </Card>
        {over ? (
          <Card style={[styles.mini, { backgroundColor: colors.wantBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="alert-outline" size={14} color={colors.wantText} />
              <T w="semibold" size={12} color={colors.wantText} numberOfLines={1}>
                {getCategory(over.id).name}
              </T>
            </View>
            <T w="bold" size={14} color="#8A4A10" style={{ marginTop: 4 }}>
              {rupees(over.spent - over.limit)} over budget
            </T>
          </Card>
        ) : (
          <Card style={[styles.mini, { backgroundColor: colors.needBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="check-circle-outline" size={14} color={colors.need} />
              <T w="semibold" size={12} color={colors.need}>
                Budgets
              </T>
            </View>
            <T w="bold" size={14} color="#0A6B4A" style={{ marginTop: 4 }}>
              All on track
            </T>
          </Card>
        )}
      </View>

      <SectionHeader title="Recent" action={recent.length ? 'See all' : undefined} onAction={() => router.navigate('/history')} />
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {recent.length === 0 ? (
          <EmptyState
            icon="notebook-edit-outline"
            title="Start your first entry"
            body="Tap + to log an expense or your salary. Want to look around first? Load two months of sample data."
            action="Load sample data"
            onAction={loadSample}
          />
        ) : (
          recent.map((e, i) => (
            <EntryRow
              key={e.id}
              entry={e}
              last={i === recent.length - 1}
              onPress={() => router.push({ pathname: '/add', params: { id: e.id } })}
              onLongPress={() => confirmDelete(e, removeEntry)}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <T w="semibold" size={11} color="#C9CBD1">
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  hero: { backgroundColor: colors.hero, borderRadius: radius.xl, padding: 18 },
  legend: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  miniRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  mini: { flex: 1, padding: 14 },
});
