import { useCallback, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getReminders, completeReminder } from '@/utils/reminderStorage';
import type { Reminder } from '@/types/reminder';

function ReminderItem({ reminder, onComplete }: { reminder: Reminder; onComplete: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const isPast = new Date(reminder.dueDate) < new Date();

  return (
    <ThemedView style={styles.reminderItem}>
      <ThemedView style={styles.reminderContent}>
        <ThemedText 
          style={[
            styles.reminderTitle,
            reminder.completed && styles.completedText,
            isPast && !reminder.completed && styles.pastDueText
          ]}
        >
          {reminder.title}
        </ThemedText>
        <ThemedText style={styles.reminderDate}>
          {new Date(reminder.dueDate).toLocaleString()}
        </ThemedText>
        {reminder.completed && (
          <ThemedText style={styles.completedAt}>
            Completed: {new Date(reminder.completedAt!).toLocaleString()}
          </ThemedText>
        )}
      </ThemedView>
      {!reminder.completed && (
        <TouchableOpacity
          onPress={onComplete}
          style={[styles.completeButton, { backgroundColor: Colors[colorScheme].tint }]}
        >
          <ThemedText style={styles.completeButtonText}>Complete</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const loadReminders = async () => {
    const loadedReminders = await getReminders();
    setReminders(loadedReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  };

  const handleComplete = async (reminderId: string) => {
    await completeReminder(reminderId);
    await loadReminders();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.heading}>Reminders</ThemedText>
      
      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            onComplete={() => handleComplete(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors[colorScheme].text}
          />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No reminders yet. Tap the + button to create one!
          </ThemedText>
        }
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    marginBottom: 24,
  },
  list: {
    gap: 16,
    flexGrow: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  reminderContent: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reminderDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  completedText: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  pastDueText: {
    color: '#ff4444',
  },
  completedAt: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 32,
  },
});
