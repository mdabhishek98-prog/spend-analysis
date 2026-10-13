import { Alert } from 'react-native';
import { getCategory } from '@/lib/categories';
import { rupees } from '@/lib/format';
import type { Entry } from '@/lib/store';

export function confirmDelete(entry: Entry, remove: (id: string) => void, after?: () => void) {
  Alert.alert('Delete this entry?', `${entry.note || getCategory(entry.categoryId).name} · ${rupees(entry.amount)}`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        remove(entry.id);
        after?.();
      },
    },
  ]);
}
