export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // ISO string
  completed: boolean;
  completedAt?: string; // ISO string
  createdAt: string; // ISO string
} 