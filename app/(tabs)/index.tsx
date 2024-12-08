import { useCallback, useState, useRef, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { 
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getReminders, completeReminder } from '@/utils/reminderStorage';
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
          {new Date(reminder.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

function DayView({ 
  date, 
  reminders, 
  onComplete, 
  onRefresh, 
  refreshing 
}: { 
  date: Date; 
  reminders: Reminder[];
  onComplete: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dayReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.dueDate);
    return reminderDate >= startOfDay && reminderDate <= endOfDay;
  });

  return (
    <Animated.View style={[styles.dayContainer, { width: SCREEN_WIDTH }]}>
      <ThemedText type="title" style={styles.heading}>{formatDate(date)}</ThemedText>
      
      <FlatList
        data={dayReminders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            onComplete={() => onComplete(item.id)}
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

  const handleComplete = async (reminderId: string) => {
    await completeReminder(reminderId);
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
  }
});
