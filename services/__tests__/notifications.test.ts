import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { 
  requestNotificationPermissions,
  scheduleTaskReminder,
  cancelTaskReminder,
  scheduleCalendarStyleNotification,
  scheduleEscalatingReminders,
  cancelEscalatingReminders,
  configureNotificationCategories,
  scheduleOverdueNotification,
  setupNotificationResponseHandlers,
  cancelAllNotifications,
  NOTIFICATION_CATEGORIES
} from '../notifications';
import { Todo } from '@/types/todo';
import * as dateUtils from '@/utils/dateUtils';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));
// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/utils/dateUtils', () => ({
  isToday: jest.fn(),
  isTomorrow: jest.fn(),
  formatDisplayDate: jest.fn(),
}));

// Properly mock the expo-device module
jest.mock('expo-device', () => {
  const mockIsDevice = { value: true };
  
  return {
    get isDevice() {
      return mockIsDevice.value;
    },
    __setMockIsDevice: (value: boolean) => {
      mockIsDevice.value = value;
    }
  };
});

// Get access to the mock to control it in tests
// We need to require this after mocking it
const DeviceMock = require('expo-device');

describe('Notification Service', () => {
  // Sample todo for testing
  const mockTodo: Todo = {
    id: 'test-id-123',
    name: 'Test Todo',
    description: 'Test Description',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0], // Today as YYYY-MM-DD
    reminder: {
      enabled: true,
      time: '14:30'
    }
  };

  // Sample recurring todo
  const mockRecurringTodo: Todo = {
    ...mockTodo,
    id: 'recurring-todo-123',
    recurring: 'daily'
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Set isDevice to true for most tests
    DeviceMock.__setMockIsDevice(true);
    
    // Mock platform
    Platform.OS = 'ios';
    
    // Mock notification permissions
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    
    // Mock scheduling notifications
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');
    
    // Mock AsyncStorage
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('notification-id-123');
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock date utils
    (dateUtils.isToday as jest.Mock).mockReturnValue(true);
    (dateUtils.isTomorrow as jest.Mock).mockReturnValue(false);
    (dateUtils.formatDisplayDate as jest.Mock).mockReturnValue('Apr 20, 2025');
  });

  describe('requestNotificationPermissions', () => {
    it('should return true if permissions are granted', async () => {
      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('should request permissions if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false if permission is denied', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
    });

    it('should return false if not a physical device', async () => {
      // Override isDevice for this specific test
      DeviceMock.__setMockIsDevice(false);
      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
    });
  });

  describe('scheduleTaskReminder', () => {
    it('should schedule a notification for a valid todo', async () => {
      const result = await scheduleTaskReminder(mockTodo);
      expect(result).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `notification_${mockTodo.id}`,
        'notification-id-123'
      );
    });

    it('should not schedule a notification for completed todos', async () => {
      const completedTodo = { ...mockTodo, completed: true };
      const result = await scheduleTaskReminder(completedTodo);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should not schedule a notification for todos without due date', async () => {
      const todoWithoutDueDate = { ...mockTodo, dueDate: undefined as unknown as string };
      const result = await scheduleTaskReminder(todoWithoutDueDate);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelTaskReminder', () => {
    it('should cancel a notification for a todo', async () => {
      const result = await cancelTaskReminder(mockTodo.id);
      expect(result).toBe(true);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id-123');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`notification_${mockTodo.id}`);
    });

    it('should handle case when notification id is not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await cancelTaskReminder('unknown-id');
      expect(result).toBe(true);
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('scheduleCalendarStyleNotification', () => {
    it('should schedule a calendar-style notification with proper content', async () => {
      // Mock date utilities to make the date appear as "tomorrow"
      (dateUtils.isToday as jest.Mock).mockReturnValue(false);
      (dateUtils.isTomorrow as jest.Mock).mockReturnValue(true);
      
      // Set a future date to avoid triggering the "time has passed" condition
      const futureTodo = {
        ...mockTodo,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
      };
      
      await scheduleCalendarStyleNotification(futureTodo);
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      
      // Verify notification content
      expect(callArgs.content.title).toBe(futureTodo.name);
      expect(callArgs.content.body).toContain('Tomorrow');
      expect(callArgs.content.data.taskId).toBe(futureTodo.id);
      expect(callArgs.content.badge).toBe(1);
      expect(callArgs.content.sound).toBe(true);
    });

    it('should handle recurring tasks differently', async () => {
      // Set a future date
      (dateUtils.isToday as jest.Mock).mockReturnValue(false);
      (dateUtils.isTomorrow as jest.Mock).mockReturnValue(true);
      
      const futureRecurringTodo = {
        ...mockRecurringTodo,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
      };
      
      await scheduleCalendarStyleNotification(futureRecurringTodo);
      
      // Get the call arguments
      const callArgs = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      
      // Verify notification includes recurring icon
      expect(callArgs.content.title).toContain('📅');
      expect(callArgs.content.data.recurring).toBe('daily');
    });
  });

  describe('scheduleEscalatingReminders', () => {
    beforeEach(() => {
      // Mock current date to be 9:00 AM today
      const mockDate = new Date();
      mockDate.setHours(9, 0, 0, 0);
      
      // Preserve Date.now functionality while mocking Date constructor
      const originalDate = global.Date;
      jest.spyOn(global, 'Date').mockImplementation((arg) => {
        return arg ? new originalDate(arg) : mockDate;
      });
      // Preserve Date.now
      global.Date.now = jest.fn(() => mockDate.getTime());
      // Ensure other static methods are preserved
      global.Date.parse = originalDate.parse;
      global.Date.UTC = originalDate.UTC;
    });

    afterEach(() => {
      jest.spyOn(global, 'Date').mockRestore();
    });

    it('should schedule escalating reminders for tasks due today', async () => {
      // Ensure isToday returns true for our task
      (dateUtils.isToday as jest.Mock).mockReturnValue(true);
      
      // Create a todo with due time far enough in the future (5 hours from now)
      const mockTodoWithFutureTime = {
        ...mockTodo,
        dueDate: new Date().toISOString().split('T')[0], // Today as YYYY-MM-DD
        reminder: {
          enabled: true,
          time: '14:30' // 2:30 PM (after our mocked 9:00 AM)
        }
      };
      
      // Add debug logging
      console.log = jest.fn();
      const spy = jest.spyOn(console, 'error');
      
      // Mock current time with controlled date
      const result = await scheduleEscalatingReminders(mockTodoWithFutureTime);
      
      // Check if any errors were logged
      if (spy.mock.calls.length > 0) {
        console.log('Debugging errors:', spy.mock.calls);
      }
      
      // Should have 4 notifications (1 hour, 30 min, 10 min, 1 min before)
      expect(result.length).toBe(4);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
      
      // Check AsyncStorage was called to store all notification IDs
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(4);
    });

    it('should not schedule reminders for completed tasks', async () => {
      const completedTodo = { ...mockTodo, completed: true };
      const result = await scheduleEscalatingReminders(completedTodo);
      
      expect(result.length).toBe(0);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should not schedule reminders for tasks not due today', async () => {
      // Task due tomorrow
      (dateUtils.isToday as jest.Mock).mockReturnValue(false);
      
      // Use a fixed date string without relying on Date.now
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      const tomorrowTodo = {
        ...mockTodo,
        dueDate: tomorrowString
      };
      
      const result = await scheduleEscalatingReminders(tomorrowTodo);
      
      expect(result.length).toBe(0);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelEscalatingReminders', () => {
    it('should cancel all escalating reminders for a task', async () => {
      // Mock different notification IDs for each reminder
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('notification_escalating_')) {
          const index = key.split('_').pop();
          return Promise.resolve(`escalating-notification-id-${index}`);
        }
        return Promise.resolve(null);
      });
      
      const result = await cancelEscalatingReminders(mockTodo.id);
      
      expect(result).toBe(true);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(4);
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(4);
    });
  });

  describe('configureNotificationCategories', () => {
    it('should set up notification categories for iOS', async () => {
      Platform.OS = 'ios';
      
      await configureNotificationCategories();
      
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledTimes(2);
      
      // Check that task reminder category was created with buttons
      const [categoryId, actions] = (Notifications.setNotificationCategoryAsync as jest.Mock).mock.calls[0];
      expect(categoryId).toBe(NOTIFICATION_CATEGORIES.TASK_REMINDER);
      expect(actions.length).toBe(2);
      expect(actions[0].identifier).toBe('MARK_COMPLETED');
      expect(actions[1].identifier).toBe('SNOOZE');
    });

    it('should not set up categories for Android', async () => {
      Platform.OS = 'android';
      
      await configureNotificationCategories();
      
      expect(Notifications.setNotificationCategoryAsync).not.toHaveBeenCalled();
    });
  });

  describe('setupNotificationResponseHandlers', () => {
    it('should set up handlers for notification responses', () => {
      const handleComplete = jest.fn();
      const handleSnooze = jest.fn();
      
      const cleanup = setupNotificationResponseHandlers(handleComplete, handleSnooze);
      
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');
    });

    it('should invoke the right handler when notification actions are triggered', async () => {
      const handleComplete = jest.fn();
      const handleSnooze = jest.fn();
      
      // Mock the response handler
      let responseCallback: any;
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          responseCallback = callback;
          return { remove: jest.fn() };
        }
      );
      
      setupNotificationResponseHandlers(handleComplete, handleSnooze);
      
      // Simulate a "complete" notification response
      responseCallback({
        actionIdentifier: 'MARK_COMPLETED',
        notification: {
          request: {
            content: {
              data: { taskId: mockTodo.id }
            }
          }
        }
      });
      
      expect(handleComplete).toHaveBeenCalledWith(mockTodo.id);
      
      // Simulate a "snooze" notification response
      responseCallback({
        actionIdentifier: 'SNOOZE',
        notification: {
          request: {
            content: {
              data: { taskId: mockTodo.id }
            }
          }
        }
      });
      
      expect(handleSnooze).toHaveBeenCalledWith(mockTodo.id);
    });
  });

  describe('scheduleOverdueNotification', () => {
    it('should schedule an immediate notification for overdue tasks', async () => {
      const result = await scheduleOverdueNotification(mockTodo);
      
      expect(result).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      
      // Check notification content
      const callArgs = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(callArgs.content.title).toContain('Overdue');
      expect(callArgs.trigger).toBeNull(); // Immediate notification
    });

    it('should not schedule notifications for completed tasks', async () => {
      const completedTodo = { ...mockTodo, completed: true };
      const result = await scheduleOverdueNotification(completedTodo);
      
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all scheduled notifications', async () => {
      const result = await cancelAllNotifications();
      
      expect(result).toBe(true);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );
      
      const result = await cancelAllNotifications();
      
      expect(result).toBe(false);
    });
  });
});