import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '@/types/reminder';
import {
	cancelNotification,
	rescheduleAllNotifications,
	scheduleNotification,
} from './notificationManager';

const STORAGE_KEY = '@reminders';

export async function saveReminder(reminder: Reminder): Promise<void> {
	try {
		const existingReminders = await getReminders();
		const updatedReminders = [...existingReminders, reminder];
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
		await scheduleNotification(reminder);
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
		await scheduleNotification(updatedReminder);
	} catch (error) {
		console.error('Error updating reminder:', error);
		throw error;
	}
}

export async function toggleReminderCompletion(reminderId: string, date: Date): Promise<void> {
	try {
		const reminders = await getReminders();
		const reminder = reminders.find(r => r.id === reminderId);
		if (!reminder) return;

		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		if (reminder.recurrence) {
			// For recurring reminders, toggle the completion date
			const isCompleted = reminder.completedDates?.some(d => {
				const completedDate = new Date(d);
				return completedDate >= startOfDay && completedDate <= endOfDay;
			});

			let completedDates = [...(reminder.completedDates || [])];
			if (isCompleted) {
				// Remove the completion for this day
				completedDates = completedDates.filter(d => {
					const completedDate = new Date(d);
					return !(completedDate >= startOfDay && completedDate <= endOfDay);
				});
			} else {
				// Add completion for this day
				completedDates.push(date.toISOString());
			}
			const updatedReminder = { ...reminder, completedDates };
			await updateReminder(updatedReminder);
		} else {
			// For non-recurring reminders, toggle completed state
			const updatedReminder = {
				...reminder,
				completed: !reminder.completed,
				completedAt: !reminder.completed ? date.toISOString() : undefined,
			};
			await updateReminder(updatedReminder);
		}
	} catch (error) {
		console.error('Error toggling reminder completion:', error);
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
						completedAt: new Date().toISOString(),
					}
				: reminder
		);
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReminders));
		await cancelNotification(reminderId);
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
		await cancelNotification(reminderId);
	} catch (error) {
		console.error('Error deleting reminder:', error);
		throw error;
	}
}

export async function initializeNotifications(): Promise<void> {
	const reminders = await getReminders();
	await rescheduleAllNotifications(reminders);
}
