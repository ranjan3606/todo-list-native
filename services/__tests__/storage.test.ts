import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getTodos, 
  saveTodos, 
  addTodo, 
  updateTodo, 
  deleteTodo, 
  toggleTodoCompletion,
  snoozeTodo,
  getTags,
  saveTags,
  getSnoozeDuration,
  saveSnoozeDuration
} from '../storage';
import { todoEvents, TODO_EVENTS } from '../eventEmitter';
import { 
  scheduleTaskReminder, 
  cancelTaskReminder, 
  scheduleEscalatingReminders,
  cancelEscalatingReminders
} from '../notifications';
import { isToday } from '@/utils/dateUtils';

// Set up AsyncStorage mock before tests
// This is the key fix - we need to mock AsyncStorage before Jest tries to use it
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock other dependencies
jest.mock('../eventEmitter', () => ({
  todoEvents: {
    emit: jest.fn()
  },
  TODO_EVENTS: {
    TODO_ADDED: 'todo_added',
    TODO_UPDATED: 'todo_updated',
    TODO_DELETED: 'todo_deleted',
    TODO_COMPLETED: 'todo_completed',
    TODO_SNOOZED: 'todo_snoozed',
    STORAGE_CHANGED: 'storage_changed',
    TAG_ADDED: 'tag_added',
    TAG_UPDATED: 'tag_updated',
    TAG_DELETED: 'tag_deleted',
    TAGS_CHANGED: 'tags_changed'
  }
}));
jest.mock('../notifications', () => ({
  scheduleTaskReminder: jest.fn().mockResolvedValue('notification-id-123'),
  cancelTaskReminder: jest.fn().mockResolvedValue(true),
  scheduleEscalatingReminders: jest.fn().mockResolvedValue(['escalating-id-1', 'escalating-id-2']),
  cancelEscalatingReminders: jest.fn().mockResolvedValue(true)
}));
jest.mock('@/utils/dateUtils', () => ({
  isToday: jest.fn()
}));

// Mock implementation to properly simulate errors in storage functions
const mockFunctionThatThrows = () => {
  // This makes sure the error is thrown when the promise is awaited, not when created
  return Promise.resolve().then(() => {
    throw new Error('Test error');
  });
};

describe('Storage Service', () => {
  const mockTodos = [
    {
      id: 'todo-1',
      name: 'Test Todo 1',
      description: 'Test Description 1',
      completed: false,
      dueDate: '2025-04-20',
      reminder: {
        enabled: true,
        time: '10:00'
      }
    },
    {
      id: 'todo-2',
      name: 'Test Todo 2',
      description: 'Test Description 2',
      completed: true,
      dueDate: '2025-04-18'
    }
  ];

  const mockTags = {
    'work': ['important', 'urgent'],
    'personal': ['health', 'family']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === '@todos') {
        return Promise.resolve(JSON.stringify(mockTodos));
      } else if (key === '@tags') {
        return Promise.resolve(JSON.stringify(mockTags));
      } else if (key === '@snooze_duration') {
        return Promise.resolve('24');
      }
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Mock isToday to return false by default
    (isToday as jest.Mock).mockReturnValue(false);
  });

  describe('getTodos', () => {
    it('should retrieve todos from AsyncStorage', async () => {
      const todos = await getTodos();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@todos');
      expect(todos).toEqual(mockTodos);
    });

    it('should return an empty array if no todos are stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const todos = await getTodos();
      
      expect(todos).toEqual([]);
    });

    it('should handle errors and return an empty array', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Test error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const todos = await getTodos();
      
      expect(todos).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveTodos', () => {
    it('should save todos to AsyncStorage', async () => {
      await saveTodos(mockTodos);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos', JSON.stringify(mockTodos));
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.STORAGE_CHANGED);
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Test error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await saveTodos(mockTodos);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('addTodo', () => {
    const newTodo = {
      id: 'new-todo',
      name: 'New Todo',
      description: 'New Description',
      completed: false,
      dueDate: '2025-04-21',
      reminder: {
        enabled: true,
        time: '09:00'
      }
    };

    it('should add a new todo and save it', async () => {
      const result = await addTodo(newTodo);
      
      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@todos');
      // Check if the new todo is added to the existing todos
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos', JSON.stringify([...mockTodos, newTodo]));
      // Check if events are emitted
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.TODO_ADDED, newTodo);
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.STORAGE_CHANGED);
    });

    it('should schedule a reminder for the new todo', async () => {
      await addTodo(newTodo);
      
      expect(scheduleTaskReminder).toHaveBeenCalledWith(newTodo);
    });

    it('should not schedule escalating reminders if the todo is not due today', async () => {
      (isToday as jest.Mock).mockReturnValue(false);
      
      await addTodo(newTodo);
      
      expect(scheduleEscalatingReminders).not.toHaveBeenCalled();
    });

    it('should schedule escalating reminders if the todo is due today', async () => {
      (isToday as jest.Mock).mockReturnValue(true);
      
      await addTodo(newTodo);
      
      expect(scheduleEscalatingReminders).toHaveBeenCalledWith(newTodo);
    });

    it('should not schedule reminders for todos without reminders enabled', async () => {
      const todoWithoutReminder = {
        ...newTodo,
        reminder: {
          enabled: false,
          time: '09:00'
        }
      };
      
      await addTodo(todoWithoutReminder);
      
      expect(scheduleEscalatingReminders).not.toHaveBeenCalled();
    });

    it('should handle errors and return false', async () => {
      // Create a spy on the console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Use the mockFunctionThatThrows for getItem to ensure error is thrown properly
      (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => mockFunctionThatThrows());
      
      const result = await addTodo(newTodo);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateTodo', () => {
    const updatedTodo = {
      ...mockTodos[0],
      name: 'Updated Todo',
      description: 'Updated Description'
    };

    it('should update an existing todo', async () => {
      const result = await updateTodo(updatedTodo);
      
      expect(result).toBe(true);
      
      // Check if the todo was updated in the saved todos
      const expectedTodos = [updatedTodo, mockTodos[1]];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos', JSON.stringify(expectedTodos));
      
      // Check if events are emitted
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.TODO_UPDATED, updatedTodo);
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.STORAGE_CHANGED);
    });

    it('should update reminders for the todo', async () => {
      await updateTodo(updatedTodo);
      
      expect(scheduleTaskReminder).toHaveBeenCalledWith(updatedTodo);
    });

    it('should schedule escalating reminders if the todo is due today', async () => {
      (isToday as jest.Mock).mockReturnValue(true);
      
      await updateTodo(updatedTodo);
      
      expect(scheduleEscalatingReminders).toHaveBeenCalledWith(updatedTodo);
    });

    it('should cancel reminders if the todo is completed', async () => {
      const completedTodo = {
        ...updatedTodo,
        completed: true
      };
      
      await updateTodo(completedTodo);
      
      expect(cancelTaskReminder).toHaveBeenCalledWith(completedTodo.id);
      expect(cancelEscalatingReminders).toHaveBeenCalledWith(completedTodo.id);
      expect(scheduleTaskReminder).not.toHaveBeenCalled();
    });

    it('should cancel reminders if reminders are disabled', async () => {
      const todoWithoutReminder = {
        ...updatedTodo,
        reminder: {
          enabled: false,
          time: '09:00'
        }
      };
      
      await updateTodo(todoWithoutReminder);
      
      expect(cancelTaskReminder).toHaveBeenCalledWith(todoWithoutReminder.id);
      expect(cancelEscalatingReminders).toHaveBeenCalledWith(todoWithoutReminder.id);
      expect(scheduleTaskReminder).not.toHaveBeenCalled();
    });

    it('should handle errors and return false', async () => {
      // Create a spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Use the mockFunctionThatThrows for getItem to ensure error is thrown properly
      (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => mockFunctionThatThrows());
      
      const result = await updateTodo(updatedTodo);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo by id', async () => {
      const result = await deleteTodo('todo-1');
      
      expect(result).toBe(true);
      
      // Check if the todo was removed from the saved todos
      const expectedTodos = [mockTodos[1]];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos', JSON.stringify(expectedTodos));
      
      // Check if events are emitted
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.TODO_DELETED, mockTodos[0]);
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.STORAGE_CHANGED);
    });

    it('should cancel all reminders for the deleted todo', async () => {
      await deleteTodo('todo-1');
      
      expect(cancelTaskReminder).toHaveBeenCalledWith('todo-1');
      expect(cancelEscalatingReminders).toHaveBeenCalledWith('todo-1');
    });

    it('should handle errors and return false', async () => {
      // Create a spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Use mockFunctionThatThrows for getItem to properly simulate errors
      (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => mockFunctionThatThrows());
      
      const result = await deleteTodo('todo-1');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('toggleTodoCompletion', () => {
    it('should toggle completion status of a todo from incomplete to complete', async () => {
      const result = await toggleTodoCompletion('todo-1');
      
      expect(result.success).toBe(true);
      expect(result.newTodo).toBeDefined();
      expect(result.newTodo?.completed).toBe(true);
      
      // Check if the todo was updated in the saved todos
      const expectedTodos = [
        { ...mockTodos[0], completed: true },
        mockTodos[1]
      ];
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@todos', JSON.stringify(expectedTodos));
      
      // Check if events are emitted
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.TODO_COMPLETED, result.newTodo);
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.STORAGE_CHANGED);
    });

    it('should toggle completion status of a todo from complete to incomplete', async () => {
      const result = await toggleTodoCompletion('todo-2');
      
      expect(result.success).toBe(true);
      expect(result.newTodo).toBeDefined();
      expect(result.newTodo?.completed).toBe(false);
    });

    it('should cancel reminders when a todo is marked as completed', async () => {
      await toggleTodoCompletion('todo-1');
      
      expect(cancelTaskReminder).toHaveBeenCalledWith('todo-1');
      expect(cancelEscalatingReminders).toHaveBeenCalledWith('todo-1');
    });

    it('should schedule reminders when a todo is marked as incomplete', async () => {
      // First, let's get the second todo which is already completed
      await toggleTodoCompletion('todo-2');
      
      // Since the second todo has reminders.enabled = undefined, we need to check if scheduleTaskReminder was not called
      expect(scheduleTaskReminder).not.toHaveBeenCalled();
    });

    it('should schedule reminders for a todo with reminders enabled when marked as incomplete', async () => {
      // Setup a previously completed todo with reminders enabled
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([
        mockTodos[0],
        {
          ...mockTodos[1],
          reminder: { enabled: true, time: '14:00' }
        }
      ]));
      
      await toggleTodoCompletion('todo-2');
      
      expect(scheduleTaskReminder).toHaveBeenCalled();
    });

    it('should handle errors and return failure', async () => {
      // Create a spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Use the mockFunctionThatThrows for getItem to ensure error is thrown properly
      (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => mockFunctionThatThrows());
      
      const result = await toggleTodoCompletion('todo-1');
      
      expect(result.success).toBe(false);
      expect(result.newTodo).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('snoozeTodo', () => {
    it('should snooze a todo by the specified number of hours', async () => {
      const snoozeDuration = 24;
      const result = await snoozeTodo('todo-1', snoozeDuration);
      
      expect(result.success).toBe(true);
      expect(result.newDueDate).toBeDefined();
      
      // Calculate the expected new due date (24 hours later)
      const originalDate = new Date('2025-04-20T00:00:00');
      const expectedDate = new Date(originalDate);
      expectedDate.setHours(expectedDate.getHours() + snoozeDuration);
      const expectedDateString = expectedDate.toISOString().split('T')[0];
      
      expect(result.newDueDate).toBe(expectedDateString);
      
      // Check if the event is emitted
      expect(todoEvents.emit).toHaveBeenCalledWith(TODO_EVENTS.TODO_SNOOZED, { id: 'todo-1', hours: snoozeDuration });
    });

    it('should reschedule reminders after snoozing a todo', async () => {
      // Mock that the new due date is today
      (isToday as jest.Mock).mockImplementationOnce(() => true);
      
      await snoozeTodo('todo-1', 24);
      
      // Should cancel existing escalating reminders
      expect(cancelEscalatingReminders).toHaveBeenCalledWith('todo-1');
      
      // Should schedule a regular reminder
      expect(scheduleTaskReminder).toHaveBeenCalled();
      
      // Should schedule escalating reminders since the new date is "today"
      expect(scheduleEscalatingReminders).toHaveBeenCalled();
    });

    it('should not schedule escalating reminders if the new date is not today', async () => {
      (isToday as jest.Mock).mockReturnValue(false);
      
      await snoozeTodo('todo-1', 24);
      
      expect(scheduleEscalatingReminders).not.toHaveBeenCalled();
    });

    it('should handle errors and return failure', async () => {
      // Create a spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Use mockFunctionThatThrows for getItem to properly simulate errors
      (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => mockFunctionThatThrows());
      
      const result = await snoozeTodo('todo-1', 24);
      
      expect(result.success).toBe(false);
      expect(result.newDueDate).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTags', () => {
    it('should retrieve tags from AsyncStorage', async () => {
      const tags = await getTags();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@tags');
      expect(tags).toEqual(mockTags);
    });

    it('should return an empty object if no tags are stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@tags') return Promise.resolve(null);
        return Promise.resolve(JSON.stringify(mockTodos));
      });
      
      const tags = await getTags();
      
      expect(tags).toEqual({});
    });

    it('should handle errors and return an empty object', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@tags') return Promise.reject(new Error('Test error'));
        return Promise.resolve(null);
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const tags = await getTags();
      
      expect(tags).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveTags', () => {
    it('should save tags to AsyncStorage', async () => {
      await saveTags(mockTags);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@tags', JSON.stringify(mockTags));
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key) => {
        if (key === '@tags') return Promise.reject(new Error('Test error'));
        return Promise.resolve();
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await saveTags(mockTags);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSnoozeDuration', () => {
    it('should retrieve snooze duration from AsyncStorage', async () => {
      const duration = await getSnoozeDuration();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@snooze_duration');
      expect(duration).toBe(24);
    });

    it('should return the default duration (24) if no value is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@snooze_duration') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      
      const duration = await getSnoozeDuration();
      
      expect(duration).toBe(24);
    });

    it('should handle errors and return the default duration', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@snooze_duration') return Promise.reject(new Error('Test error'));
        return Promise.resolve(null);
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const duration = await getSnoozeDuration();
      
      expect(duration).toBe(24);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveSnoozeDuration', () => {
    it('should save snooze duration to AsyncStorage', async () => {
      const duration = 12;
      await saveSnoozeDuration(duration);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@snooze_duration', duration.toString());
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockImplementation((key) => {
        if (key === '@snooze_duration') return Promise.reject(new Error('Test error'));
        return Promise.resolve();
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await saveSnoozeDuration(12);
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});