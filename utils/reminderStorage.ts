import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '@/types/reminder';

const STORAGE_KEY = '@reminders';

export async function saveReminder(reminder: Reminder): Promise<void> {
  try {
    const existingReminders = await getReminders();
    const updatedReminders = [...existingReminders, reminder];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error saving reminder:', error);
    throw error;
  }
}

export async function getReminders(): Promise<Reminder[]> {
  try {
    const remindersJson = await AsyncStorage.getItem(STORAGE_KEY);
    return remindersJson ? JSON.parse(remindersJson) : [];
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
}

export async function updateReminder(updatedReminder: Reminder): Promise<void> {
  try {
    const reminders = await getReminders();
    const updatedReminders = reminders.map(reminder => 
      reminder.id === updatedReminder.id ? updatedReminder : reminder
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
}

export async function completeReminder(reminderId: string): Promise<void> {
  try {
    const reminders = await getReminders();
    const updatedReminders = reminders.map(reminder => 
      reminder.id === reminderId 
        ? { 
            ...reminder, 
            completed: true, 
            completedAt: new Date().toISOString() 
          } 
        : reminder
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error completing reminder:', error);
    throw error;
  }
}

export async function deleteReminder(reminderId: string): Promise<void> {
  try {
    const reminders = await getReminders();
    const updatedReminders = reminders.filter(reminder => reminder.id !== reminderId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
} 