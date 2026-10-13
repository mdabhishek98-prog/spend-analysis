import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MonthNav } from '@/components/MonthNav';
import { Bar, Card, Chip, EmptyState, IconTile, PageTitle, Screen, SectionHeader, T } from '@/components/ui';
import { getCategory, PAY_MODES, PayMode, PRIORITIES } from '@/lib/categories';
import { monthName, rupees, shiftMonth } from '@/lib/format';
import { adviceFor, prioritySplit, summarize } from '@/lib/insights';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

// Neutral blues and greys: green, orange and purple already mean Needs, Wants and Savings.
const DONUT = [colors.ink, colors.brand, '#8394FF', '#C3CBFF', '#5E626B', '#C9CBD1'];
const TONE = {
  warn: { color: colors.danger, bg: colors.dangerBg },
  good: { color: colors.need, bg: colors.needBg },
  info: { color: colors.brand, bg: colors.brandBg },
};

export default function Insights() {
  const { entries, month, budgets, monthLimit, loadSample } = useStore();
  const s = useMemo(() => summarize(entries, month), [entries, month]);
  const prev = useMemo(() => summarize(entries, shiftMonth(month, -1)), [entries, month]);
  const split = prioritySplit(s);
  const advice = useMemo(() => adviceFor(entries, month, budgets, monthLimit), [entries, month, budgets, monthLimit]);
  const allOk = split.every((r) => r.ok);

  const spendCats = s.byCategory.filter((c) => c.priority !== 'saving');
  const top = spendCats.slice(0, 5);
  const rest = spendCats.slice(5).reduce((a, c) => a + c.amount, 0);
  const slices = [...top.map((c) => ({ label: getCategory(c.id).name, amount: c.amount })), ...(rest ? [{ label: 'Everything else', amount: rest }] : [])];
  const diff = s.spent - prev.spent;

  return (
    <Screen header={<PageTitle title="Insights" subtitle={`Where your money should go · ${monthName(month)}`} right={<MonthNav />} />}>
      {s.count === 0 ? (
        <Card padded={false}>
          <EmptyState icon="chart-donut" title="No data for this month" body="Log a few expenses and your income to see your priorities." action="Load sample data" onAction={loadSample} />
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.rowBetween}>
              <T w="bold" size={15}>
                Your priority split
              </T>
              {allOk ? <Chip label="On track" icon="check" color={colors.need} bg={colors.needBg} /> : <Chip label="Needs attention" color={colors.danger} bg={colors.dangerBg} />}
            </View>
            <T size={12} color={colors.ink2} style={{ marginTop: 2, marginBottom: 14 }}>
              {s.income ? 'Share of your income vs. the 50 / 30 / 20 rule' : 'Add income for a full picture'}
            </T>
            {split.map((r) => {
              const p = PRIORITIES[r.key];
              const label = r.key === 'saving' ? 'Savings' : `${p.label}s`;
              return (
                <View key={r.key} style={{ marginBottom: 14 }}>
                  <View style={styles.rowBetween}>
                    <T w="bold" size={13} color={p.text}>
                      {label}
                    </T>
                    <T size={12} color={colors.ink2}>
                      <T w="bold" size={13} color={r.ok ? colors.ink : colors.danger}>
                        {Math.round(r.pct * 100)}%
                      </T>
                      {'  '}
                      {r.key === 'saving' ? 'aim for' : 'max'} {Math.round(r.target * 100)}%
                    </T>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <Bar segments={[{ value: r.pct, color: r.ok ? p.color : colors.danger }]} />
                    <View style={[styles.targetTick, { left: `${r.target * 100}%` }]} />
                  </View>
                  <T size={11} color={colors.ink3} style={{ marginTop: 4 }}>
                    {rupees(r.amount)}
                  </T>
                </View>
              );
            })}
          </Card>

          <SectionHeader title="What to do next" />
          <View style={{ gap: 8 }}>
            {advice.map((a, i) => (
              <Card key={i} style={styles.advice}>
                <IconTile name={a.icon} color={TONE[a.tone].color} bg={TONE[a.tone].bg} size={34} />
                <View style={{ flex: 1 }}>
                  <T w="bold" size={14}>
                    {a.title}
                  </T>
                  <T size={13} color={colors.ink2} style={{ marginTop: 2, lineHeight: 19 }}>
                    {a.body}
                  </T>
                </View>
              </Card>
            ))}
          </View>

          {slices.length > 0 && (
            <>
              <SectionHeader title="Where it went" />
              <Card style={styles.donutCard}>
                <Donut values={slices.map((x) => x.amount)} total={s.spent} />
                <View style={{ flex: 1, gap: 8 }}>
                  {slices.map((x, i) => (
                    <View key={x.label} style={styles.rowBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <View style={[styles.dot, { backgroundColor: DONUT[i] }]} />
                        <T size={12} numberOfLines={1} style={{ flexShrink: 1 }}>
                          {x.label}
                        </T>
                      </View>
                      <T w="bold" size={12}>
                        {rupees(x.amount)}
                      </T>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          )}

          <SectionHeader title="At a glance" />
          <View style={styles.grid}>
            <Stat label="vs last month" value={prev.spent ? `${diff > 0 ? '+' : '−'}${rupees(Math.abs(diff))}` : '—'} tint={prev.spent ? (diff > 0 ? colors.danger : colors.need) : undefined} />
            <Stat label="Invested" value={rupees(s.invested)} tint={colors.save} />
            {(Object.keys(PAY_MODES) as PayMode[]).map((m) => (
              <Stat key={m} label={`Paid by ${PAY_MODES[m].label}`} value={rupees(s.byMode[m])} />
            ))}
            <Stat label="Entries" value={String(s.count)} />
          </View>
        </>
      )}
    </Screen>
  );
}

function Donut({ values, total }: { values: number[]; total: number }) {
  const size = 112;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = values.reduce((a, b) => a + b, 0) || 1;
  const lengths = values.map((v) => (v / sum) * c);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        {lengths.map((len, i) => (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={DONUT[i]}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
              strokeDashoffset={-starts[i]}
            />
        ))}
      </Svg>
      <T size={10} color={colors.ink2}>
        Spent
      </T>
      <T w="heavy" size={13}>
        {rupees(total)}
      </T>
    </View>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <Card style={styles.stat}>
      <T size={12} color={colors.ink2}>
        {label}
      </T>
      <T w="heavy" size={17} color={tint ?? colors.ink} style={{ marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetTick: { position: 'absolute', top: -3, width: 2, height: 14, marginLeft: -1, borderRadius: 1, backgroundColor: colors.ink },
  advice: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  donutCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexGrow: 1, padding: 14 },
});
