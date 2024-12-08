import { useCallback, useState, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { 
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getReminders, toggleReminderCompletion } from '@/utils/reminderStorage';
import type { Reminder } from '@/types/reminder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const INITIAL_INDEX = 50;

function formatDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((compareDate.getTime() - today.getTime()) / DAY_IN_MS);
  
  switch (diffDays) {
    case 0:
      return 'Today';
    case 1:
      return 'Tomorrow';
    case -1:
      return 'Yesterday';
    default:
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
  }
}

function isReminderDueOnDate(reminder: Reminder, date: Date): boolean {
  const reminderDate = new Date(reminder.dueDate);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // If no recurrence, just check if it's on this day
  if (!reminder.recurrence) {
    const reminderStartOfDay = new Date(reminderDate);
    reminderStartOfDay.setHours(0, 0, 0, 0);
    return reminderStartOfDay.getTime() === startOfDay.getTime();
  }

  // For recurring reminders, check if this date is a recurrence
  const originalDate = new Date(reminder.dueDate);
  originalDate.setHours(0, 0, 0, 0);
  const timeDiff = startOfDay.getTime() - originalDate.getTime();
  const daysDiff = Math.round(timeDiff / DAY_IN_MS);

  switch (reminder.recurrence.type) {
    case 'daily':
      return daysDiff >= 0;
    case 'weekly':
      return daysDiff >= 0 && daysDiff % 7 === 0;
    case 'monthly': {
      const originalDay = originalDate.getDate();
      return date.getDate() === originalDay && daysDiff >= 0;
    }
    case 'custom': {
      const { customDays } = reminder.recurrence;
      return daysDiff >= 0 && daysDiff % (customDays || 1) === 0;
    }
    default:
      return false;
  }
}

function isReminderCompletedOnDate(reminder: Reminder, date: Date): boolean {
  if (!reminder.completedDates?.length) return false;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return reminder.completedDates.some(completedDate => {
    const date = new Date(completedDate);
    return date >= startOfDay && date <= endOfDay;
  });
}

function ReminderItem({ reminder, date, onComplete }: { 
  reminder: Reminder; 
  date: Date;
  onComplete: () => void; 
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const now = new Date();
  const reminderDate = new Date(reminder.dueDate);
  const isPast = reminderDate.getTime() <= now.getTime();
  const isCompleted = isReminderCompletedOnDate(reminder, date);
  const isShownOnFutureDate = date.setHours(0,0,0) > now.setHours(0,0,0);

  return (
    <ThemedView style={styles.reminderItem}>
      <ThemedView style={styles.reminderContent}>
        <View style={styles.titleContainer}>
          <ThemedText 
            style={[
              styles.reminderTitle,
              isCompleted && styles.completedText,
              isPast && !isCompleted && styles.pastDueText
            ]}
          >
            {reminder.title}
          </ThemedText>
          {reminder.recurrence && (
            <ThemedText style={styles.recurrenceTag}>
              {reminder.recurrence.type === 'custom' 
                ? `Every ${reminder.recurrence.customDays} days`
                : reminder.recurrence.type}
            </ThemedText>
          )}
        </View>
        <ThemedText style={styles.reminderDate}>
          {new Date(reminder.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
        {isCompleted && (
          <ThemedText style={styles.completedAt}>
            Completed: {new Date(
              reminder.completedDates!.find(d => isReminderCompletedOnDate({ ...reminder, completedDates: [d] }, date))!
            ).toLocaleString()}
          </ThemedText>
        )}
      </ThemedView>
      {!isShownOnFutureDate && (
        <TouchableOpacity
          onPress={onComplete}
          style={[
            styles.completeButton, 
            { backgroundColor: isCompleted ? Colors[colorScheme].icon : Colors[colorScheme].tint }
          ]}
        >
          <ThemedText style={styles.completeButtonText}>
            {isCompleted ? 'Undo' : 'Complete'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

function DayView({ 
  date, 
  reminders, 
  onComplete, 
  onRefresh, 
  refreshing 
}: { 
  date: Date; 
  reminders: Reminder[];
  onComplete: (id: string, date: Date) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  const dayReminders = reminders.filter(reminder => isReminderDueOnDate(reminder, date));

  return (
    <Animated.View style={[styles.dayContainer, { width: SCREEN_WIDTH }]}>
      <ThemedText type="title" style={styles.heading}>{formatDate(date)}</ThemedText>
      
      <FlatList
        data={dayReminders}
        keyExtractor={item => `${item.id}-${date.toISOString()}`}
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            date={date}
            onComplete={() => onComplete(item.id, date)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme].text}
          />
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No reminders for this day
          </ThemedText>
        }
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Date>);

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useSharedValue(0);
  const [isReady, setIsReady] = useState(false);
  
  const dates = useMemo(() => Array.from({ length: 100 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i - INITIAL_INDEX));
    return date;
  }), []);

  const loadReminders = async () => {
    const loadedReminders = await getReminders();
    setReminders(loadedReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    setIsReady(true);
  };

  const handleComplete = async (reminderId: string, date: Date) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    await toggleReminderCompletion(reminderId, date);
    await loadReminders();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    }
  });

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  if (!isReady) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AnimatedFlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={dates}
        keyExtractor={(item: Date) => item.toISOString()}
        renderItem={({ item: date }) => (
          <DayView
            date={date}
            reminders={reminders}
            onComplete={handleComplete}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
        initialScrollIndex={INITIAL_INDEX}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayContainer: {
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurrenceTag: {
    fontSize: 12,
    opacity: 0.7,
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  futureText: {
    color: '#ccc',
    fontSize: 12,
    opacity: 0.7,
  },
});
