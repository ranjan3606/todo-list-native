import { Todo } from '@/types/todo';

/**
 * Calculate the next due date based on recurrence pattern
 */
export const getNextDueDate = (currentDueDate: string, recurrence: Todo['recurring']): string => {
  const currentDate = new Date(currentDueDate + 'T00:00:00'); // Ensure correct parsing
  if (isNaN(currentDate.getTime())) return currentDueDate; // Invalid date

  let nextDate = new Date(currentDate);

  switch (recurrence) {
    case 'daily':
      nextDate.setDate(currentDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + 1);
      // Handle month rollovers carefully (e.g., Jan 31 -> Feb 28/29)
      if (nextDate.getDate() < currentDate.getDate()) {
         nextDate.setDate(0); // Go to last day of previous month (which is the correct month now)
      }
      break;
    case 'yearly':
      nextDate.setFullYear(currentDate.getFullYear() + 1);
      break;
    default:
      return currentDueDate; // No change for 'none' or invalid
  }
  return nextDate.toISOString().split('T')[0];
};

/**
 * Check if a date is today - improved to handle timezone issues
 */
export const isToday = (date: string): boolean => {
  if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  return today.getTime() === taskDate.getTime();
};

/**
 * Check if a date is tomorrow - improved to handle timezone issues
 */
export const isTomorrow = (date: string): boolean => {
  if (!date) return false;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  return tomorrow.getTime() === taskDate.getTime();
};

/**
 * Check if a date is within the next 3 days
 */
export const isDueSoon = (date: string): boolean => {
  const dueDate = new Date(date + 'T00:00:00');
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  return dueDate <= threeDaysFromNow && dueDate >= new Date();
};

/**
 * Format a date string for display with locale support
 */
export const formatDisplayDate = (dateString: string, locale = 'en-US'): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Categorize tasks by due date - improved with better date handling
 */
export const categorizeTasks = (tasks: Todo[]) => {
  const today: Todo[] = [];
  const tomorrow: Todo[] = [];
  const upcoming: Todo[] = [];
  const past: Todo[] = []; // Add this to track past tasks

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Beginning of today

  tasks.forEach(task => {
    if (!task.dueDate) {
      // Handle tasks without due dates - consider them as today's tasks
      today.push(task);
      return;
    }
    
    if (isToday(task.dueDate)) {
      today.push(task);
    } else if (isTomorrow(task.dueDate)) {
      tomorrow.push(task);
    } else {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      
      if (taskDate.getTime() > now.getTime()) {
        upcoming.push(task);
      } else {
        // Past tasks - you might want to show them in a different section
        past.push(task);
      }
    }
  });

  // Sort by due date (nearest first)
  const sortByDueDate = (a: Todo, b: Todo) => {
    if (!a.dueDate) return -1;
    if (!b.dueDate) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  };

  today.sort(sortByDueDate);
  tomorrow.sort(sortByDueDate);
  upcoming.sort(sortByDueDate);
  past.sort(sortByDueDate);
  
  return { today, tomorrow, upcoming, past };
};
