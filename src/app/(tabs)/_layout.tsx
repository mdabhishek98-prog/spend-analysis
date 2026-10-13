import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Tabs from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, T } from '@/components/ui';
import type { IconName } from '@/lib/categories';
import { colors } from '@/lib/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home-outline' },
  insights: { label: 'Insights', icon: 'chart-donut' },
  budgets: { label: 'Budgets', icon: 'target' },
  history: { label: 'History', icon: 'format-list-bulleted' },
};

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

function TabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const tab = (i: number) => {
    const route = state.routes[i];
    const meta = TABS[route.name];
    const active = state.index === i;
    const color = active ? colors.ink : colors.ink3;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={meta.label}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
      >
        <Icon name={meta.icon} size={23} color={color} />
        <T w={active ? 'bold' : 'semibold'} size={10} color={color} style={{ marginTop: 3 }}>
          {meta.label}
        </T>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tab(0)}
      {tab(1)}
      <View style={styles.fabSlot}>
        <Pressable
          accessibilityLabel="Add expense"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push('/add');
          }}
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Icon name="plus" size={30} color="#fff" />
        </Pressable>
      </View>
      {tab(2)}
      {tab(3)}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }} tabBar={(props) => <TabBar {...(props as unknown as BarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="budgets" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  fabSlot: { width: 72, alignItems: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    marginTop: -26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 8 },
      default: { shadowColor: colors.brand, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
    }),
  },
});
