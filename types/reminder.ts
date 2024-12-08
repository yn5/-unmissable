export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceConfig {
	type: RecurrenceType;
}

export interface Reminder {
	id: string;
	title: string;
	dueDate: string; // ISO string
	completed: boolean;
	completedAt?: string; // ISO string
	createdAt: string; // ISO string
	recurrence?: RecurrenceConfig;
	completedDates?: string[]; // ISO strings of dates when recurring reminder was completed
}
