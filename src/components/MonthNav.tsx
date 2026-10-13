import { View } from 'react-native';
import { currentMonth, shiftMonth } from '@/lib/format';
import { useStore } from '@/lib/store';
import { RoundButton } from './ui';

export function MonthNav() {
  const { month, setMonth } = useStore();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <RoundButton icon="chevron-left" label="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} />
      <RoundButton
        icon="chevron-right"
        label="Next month"
        onPress={() => month < currentMonth() && setMonth(shiftMonth(month, 1))}
      />
    </View>
  );
}
