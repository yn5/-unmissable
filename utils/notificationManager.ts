import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/types/reminder';

// Configure notification behavior
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

// Configure default notification behavior
const NOTIFICATION_REPEAT_INTERVAL_MINUTES = 1;

export async function registerForPushNotificationsAsync() {
	let token;

	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		});
	}

	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;
	if (existingStatus !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}
	if (finalStatus !== 'granted') {
		console.log('Failed to get push token for push notification!');
		return;
	}

	return token;
}

export async function scheduleNotification(reminder: Reminder) {
	const dueDate = new Date(reminder.dueDate);

	// Cancel any existing notifications for this reminder
	await cancelNotification(reminder.id);

	if (reminder.completed) {
		return; // Don't schedule notifications for completed reminders
	}

	const now = new Date();
	if (dueDate <= now) {
		return; // Don't schedule notifications for past reminders
	}

	const notificationContent = {
		title: 'Reminder: ' + reminder.title,
		body: 'This task is due!',
		data: { reminderId: reminder.id },
	};

	if (reminder.recurrence) {
		// For recurring reminders
		await scheduleRecurringNotification(reminder, notificationContent);
	} else {
		// For one-time reminders
		await scheduleOneTimeNotification(reminder, notificationContent);
	}
}

async function scheduleOneTimeNotification(
	reminder: Reminder,
	content: Notifications.NotificationContentInput
) {
	const dueDate = new Date(reminder.dueDate);

	// Schedule the initial notification at due time
	await Notifications.scheduleNotificationAsync({
		content,
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: dueDate,
		},
	});

	// Schedule follow-up notifications every NOTIFICATION_REPEAT_INTERVAL minutes
	// until 24 hours after due time
	const endTime = new Date(dueDate);
	endTime.setHours(endTime.getHours() + 24);

	for (
		let time = new Date(dueDate.getTime() + NOTIFICATION_REPEAT_INTERVAL_MINUTES * 60000);
		time <= endTime;
		time = new Date(time.getTime() + NOTIFICATION_REPEAT_INTERVAL_MINUTES * 60000)
	) {
		await Notifications.scheduleNotificationAsync({
			content: {
				...content,
				title: `Overdue: ${reminder.title}`,
				body: 'This task is overdue! Please complete it.',
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: time,
			},
		});
	}
}

async function scheduleRecurringNotification(
	reminder: Reminder,
	content: Notifications.NotificationContentInput
) {
	const trigger = calculateRecurringTrigger(reminder);

	if (!trigger) return;

	// Schedule the recurring notification
	await Notifications.scheduleNotificationAsync({
		content,
		trigger,
	});

	// Schedule follow-up notifications
	const followUpTrigger = {
		type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
		seconds: NOTIFICATION_REPEAT_INTERVAL_MINUTES * 60,
		repeats: true,
	};

	await Notifications.scheduleNotificationAsync({
		content: {
			...content,
			title: `Overdue: ${reminder.title}`,
			body: 'This recurring task is due! Please complete it.',
		},
		trigger: followUpTrigger as Notifications.TimeIntervalTriggerInput,
	});
}

function calculateRecurringTrigger(
	reminder: Reminder
):
	| Notifications.DailyTriggerInput
	| Notifications.WeeklyTriggerInput
	| Notifications.MonthlyTriggerInput
	| null {
	if (!reminder.recurrence) return null;

	const dueDate = new Date(reminder.dueDate);

	switch (reminder.recurrence.type) {
		case 'daily':
			return {
				type: Notifications.SchedulableTriggerInputTypes.DAILY,
				hour: dueDate.getHours(),
				minute: dueDate.getMinutes(),
			};
		case 'weekly':
			return {
				type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
				hour: dueDate.getHours(),
				minute: dueDate.getMinutes(),
				weekday: dueDate.getDay() + 1, // Expo uses 1-7 for weekdays,
			};
		case 'monthly':
			// For monthly, we'll use daily trigger and manually check the date
			return {
				type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
				hour: dueDate.getHours(),
				minute: dueDate.getMinutes(),
				day: dueDate.getDate(), // Expo uses 1-7 for weekdays,
			};
		default:
			return null;
	}
}

export async function cancelNotification(reminderId: string) {
	const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
	const notifications = scheduledNotifications.filter(
		notification => notification.content.data?.reminderId === reminderId
	);

	for (const notification of notifications) {
		await Notifications.cancelScheduledNotificationAsync(notification.identifier);
	}
}

export async function rescheduleAllNotifications(reminders: Reminder[]) {
	// Cancel all existing notifications
	await Notifications.cancelAllScheduledNotificationsAsync();

	// Reschedule notifications for all non-completed reminders
	for (const reminder of reminders) {
		await scheduleNotification(reminder);
	}
}
