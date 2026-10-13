import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategory, IconName, PAY_MODES, PRIORITIES } from '@/lib/categories';
import { dayLabel, rupees } from '@/lib/format';
import type { Entry } from '@/lib/store';
import { colors, fonts, radius, Weight } from '@/lib/theme';

// Android can't synthesise weights for custom fonts, so weight maps to a font file instead of fontWeight.
export function T({ w = 'regular', size = 14, color = colors.ink, style, ...rest }: TextProps & { w?: Weight; size?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: fonts[w], fontSize: size, color, includeFontPadding: false }, style]} />;
}

export function Icon({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

/** Scrollable tab screen with safe-area top padding and room for the tab bar. */
export function Screen({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.pageTitle}>
      <View style={{ flex: 1 }}>
        <T w="heavy" size={26} style={{ letterSpacing: -0.6 }}>
          {title}
        </T>
        {subtitle ? (
          <T size={13} color={colors.ink2} style={{ marginTop: 2 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: ViewStyle | ViewStyle[]; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: 16 }, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <T w="bold" size={15}>
        {title}
      </T>
      {action ? (
        <Pressable hitSlop={10} onPress={onAction}>
          <T w="bold" size={13} color={colors.brand}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, color, bg, icon }: { label: string; color: string; bg: string; icon?: IconName }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <T w="bold" size={11} color={color}>
        {label}
      </T>
    </View>
  );
}

export function IconTile({ name, color, bg, size = 40 }: { name: IconName; color: string; bg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}

/** Rounded progress track. `segments` are fractions of the full width. */
export function Bar({ segments, height = 8, track = colors.line }: { segments: { value: number; color: string }[]; height?: number; track?: string }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', flexDirection: 'row' }}>
      {segments.map((s, i) => (
        <View key={i} style={{ width: `${Math.max(0, Math.min(1, s.value)) * 100}%`, backgroundColor: s.color, height: '100%' }} />
      ))}
    </View>
  );
}

export function RoundButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.roundBtn, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

export function EntryRow({ entry, onPress, onLongPress, last, showDate = true }: {
  entry: Entry;
  onPress?: () => void;
  onLongPress?: () => void;
  last?: boolean;
  showDate?: boolean;
}) {
  const cat = getCategory(entry.categoryId);
  const income = entry.type === 'income';
  const p = PRIORITIES[entry.priority];
  const tint = income ? { color: colors.income, bg: colors.needBg } : { color: p.text, bg: p.bg };
  const meta = [showDate ? dayLabel(entry.date) : null, PAY_MODES[entry.mode].label].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      style={[styles.row, !last && styles.rowBorder]}
    >
      <IconTile name={cat.icon} color={tint.color} bg={tint.bg} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <T w="bold" size={14} numberOfLines={1}>
          {entry.note || cat.name}
        </T>
        <T size={12} color={colors.ink2} numberOfLines={1} style={{ marginTop: 2 }}>
          {entry.note ? `${cat.name} · ${meta}` : meta}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <T w="bold" size={14} color={income ? colors.income : colors.ink}>
          {income ? rupees(entry.amount, { sign: true }) : `−${rupees(entry.amount)}`}
        </T>
        {income ? <Chip label="Income" color={colors.income} bg={colors.needBg} /> : <Chip label={p.label} color={p.text} bg={p.bg} />}
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <IconTile name={icon} color={colors.brand} bg={colors.brandBg} size={52} />
      <T w="bold" size={16} style={{ marginTop: 12 }}>
        {title}
      </T>
      <T size={13} color={colors.ink2} style={{ marginTop: 4, textAlign: 'center', lineHeight: 19 }}>
        {body}
      </T>
      {action ? (
        <Pressable onPress={onAction} style={styles.emptyBtn}>
          <T w="bold" size={13} color={colors.brand}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export const shadow = Platform.select<ViewStyle>({
  android: { elevation: 2 },
  default: { shadowColor: '#15171C', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
});

const styles = StyleSheet.create({
  pageTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  roundBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  emptyBtn: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.brandBg },
});
