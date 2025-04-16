export interface Todo {
  id: string;
  name: string;
  description: string;
  dueDate: string; // This will be the *current* due date for recurring tasks
  completed: boolean;
  tags?: string[]; // Optional array of tag names
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // Recurrence frequency
  originalDueDate?: string; // To track the start date of a recurring series
  isRecurringInstance?: boolean; // To differentiate original vs generated tasks
  reminder?: {
    enabled: boolean;
    time: string; // Format: "HH:MM" in 24-hour format
  };
}
