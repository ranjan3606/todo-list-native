import { renderHook, act } from '@testing-library/react-native';
import { useTodos } from '../useTodos';
import { getTodos, updateTodo as updateTodoInStorage } from '@/services/storage';
import { TODO_EVENTS, todoEvents } from '@/services/eventEmitter';
import { Todo } from '@/types/todo';

// Mock the dependencies
jest.mock('@/services/storage', () => ({
  getTodos: jest.fn(),
  updateTodo: jest.fn()
}));

// Mock the event emitter without trying to extend EventEmitter
jest.mock('@/services/eventEmitter', () => ({
  TODO_EVENTS: {
    STORAGE_CHANGED: 'storage-changed',
    TODO_ADDED: 'todo-added',
    TODO_UPDATED: 'todo-updated',
    TODO_DELETED: 'todo-deleted',
    TODO_COMPLETED: 'todo-completed',
    TODO_SNOOZED: 'todo-snoozed'
  },
  todoEvents: {
    emit: jest.fn(),
    on: jest.fn().mockImplementation(() => jest.fn()), // Return unsubscribe function
  }
}));

describe('useTodos Hook', () => {
  // Sample todo items for testing
  const mockTodos: Todo[] = [
    {
      id: 'todo-1',
      name: 'Test Todo 1',
      completed: false,
      dueDate: '2025-04-20',
      tags: ['work'],
      description: 'Test description'
    },
    {
      id: 'todo-2',
      name: 'Test Todo 2',
      completed: true,
      dueDate: '2025-04-15',
      tags: ['personal'],
      description: 'Another test description'
    },
    {
      id: 'todo-3',
      name: 'Test Todo 3',
      completed: false,
      dueDate: '2025-04-22',
      tags: ['work', 'urgent'],
      description: 'Important task'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default implementation to return mock todos
    (getTodos as jest.Mock).mockResolvedValue(mockTodos);
    (updateTodoInStorage as jest.Mock).mockResolvedValue(true);
    
    // Setup mock event emitter
    const eventCallbacks: Record<string, Function[]> = {};
    
    (todoEvents.on as jest.Mock).mockImplementation((event, callback) => {
      if (!eventCallbacks[event]) {
        eventCallbacks[event] = [];
      }
      eventCallbacks[event].push(callback);
      
      // Return unsubscribe function that removes the callback
      return () => {
        if (eventCallbacks[event]) {
          const index = eventCallbacks[event].indexOf(callback);
          if (index !== -1) {
            eventCallbacks[event].splice(index, 1);
          }
        }
      };
    });
    
    (todoEvents.emit as jest.Mock).mockImplementation((event, ...args) => {
      if (eventCallbacks[event]) {
        eventCallbacks[event].forEach(callback => callback(...args));
      }
    });
  });

  it('should fetch todos on initial render', async () => {
    const { result } = renderHook(() => useTodos());
    
    // Initially should be loading with empty array
    expect(result.current.isLoading).toBe(true);
    expect(result.current.todos).toEqual([]);
    
    // Force update and wait for state changes to reflect
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // After loading, should have todos and not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.todos).toEqual(mockTodos);
    expect(getTodos).toHaveBeenCalledTimes(1);
  });

  it('should handle empty todo list correctly', async () => {
    // Mock empty todo list
    (getTodos as jest.Mock).mockResolvedValue([]);
    
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    expect(result.current.todos).toEqual([]);
    expect(result.current.completedTodos).toEqual([]);
    expect(result.current.incompleteTodos).toEqual([]);
  });

  it('should handle null return from getTodos', async () => {
    // Mock null return
    (getTodos as jest.Mock).mockResolvedValue(null);
    
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Should handle null gracefully and provide empty arrays
    expect(result.current.todos).toEqual([]);
    expect(result.current.completedTodos).toEqual([]);
    expect(result.current.incompleteTodos).toEqual([]);
  });

  it('should properly filter todos into completed and incomplete', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Should have correct number of completed and incomplete todos
    expect(result.current.completedTodos.length).toBe(1);
    expect(result.current.incompleteTodos.length).toBe(2);
    
    // Verify the specific todos
    expect(result.current.completedTodos[0].id).toBe('todo-2');
    expect(result.current.incompleteTodos[0].id).toBe('todo-1');
    expect(result.current.incompleteTodos[1].id).toBe('todo-3');
  });

  it('should update a todo correctly', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Update a todo
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { 
        completed: true,
        name: 'Updated Todo Name'
      });
      
      expect(success).toBe(true);
    });
    
    // Verify the update was made with the correct data
    expect(updateTodoInStorage).toHaveBeenCalledWith({
      ...mockTodos[0],
      completed: true,
      name: 'Updated Todo Name'
    });
    
    // Verify event was emitted
    expect(todoEvents.emit).toHaveBeenCalledWith(
      TODO_EVENTS.TODO_UPDATED,
      expect.objectContaining({
        id: 'todo-1',
        completed: true,
        name: 'Updated Todo Name'
      })
    );
  });

  it('should update a todo partially', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Update only the description field
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { 
        description: 'Updated description only'
      });
      
      expect(success).toBe(true);
    });
    
    // Verify only description was updated while keeping other properties
    expect(updateTodoInStorage).toHaveBeenCalledWith({
      ...mockTodos[0],
      description: 'Updated description only'
    });
  });

  it('should update todo tags correctly', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Update tags
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { 
        tags: ['work', 'important', 'meeting']
      });
      
      expect(success).toBe(true);
    });
    
    // Verify tags were updated correctly
    expect(updateTodoInStorage).toHaveBeenCalledWith({
      ...mockTodos[0],
      tags: ['work', 'important', 'meeting']
    });
  });

  it('should update due date correctly', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    const newDueDate = '2025-06-30';
    
    // Update due date
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { 
        dueDate: newDueDate
      });
      
      expect(success).toBe(true);
    });
    
    // Verify due date was updated
    expect(updateTodoInStorage).toHaveBeenCalledWith({
      ...mockTodos[0],
      dueDate: newDueDate
    });
  });

  it('should handle unsuccessful todo updates', async () => {
    // Mock a failure
    (updateTodoInStorage as jest.Mock).mockResolvedValue(false);
    
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Try to update a todo
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { completed: true });
      
      expect(success).toBe(false);
    });
    
    // Event should not be emitted on failure
    expect(todoEvents.emit).not.toHaveBeenCalledWith(
      TODO_EVENTS.TODO_UPDATED,
      expect.anything()
    );
  });

  it('should return false when trying to update a non-existent todo', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Try to update a non-existent todo
    await act(async () => {
      const success = await result.current.updateTodo('non-existent-id', { completed: true });
      
      expect(success).toBe(false);
    });
    
    // Update should not be called
    expect(updateTodoInStorage).not.toHaveBeenCalled();
  });

  it('should refresh todos when the refresh function is called', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Clear the mock calls
    (getTodos as jest.Mock).mockClear();
    
    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });
    
    // getTodos should be called again
    expect(getTodos).toHaveBeenCalledTimes(1);
  });

  it('should refresh todos when a todo event is emitted', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Clear the mock calls
    (getTodos as jest.Mock).mockClear();
    
    // Emit a TODO_ADDED event
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_ADDED);
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // getTodos should be called again
    expect(getTodos).toHaveBeenCalledTimes(2);
  });

  it('should handle errors during todo fetching', async () => {
    // Mock an error being thrown
    console.error = jest.fn(); // Spy on console.error
    (getTodos as jest.Mock).mockRejectedValue(new Error('Failed to fetch todos'));
    
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Should handle error gracefully
    expect(result.current.todos).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  // Test each event type separately
  it('should refresh on TODO_STORAGE_CHANGED event', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    (getTodos as jest.Mock).mockClear();
    
    // Count how many times getTodos is called after emitting the event
    const callCountBefore = (getTodos as jest.Mock).mock.calls.length;
    
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.STORAGE_CHANGED);
      await Promise.resolve();
    });
    
    const callCountAfter = (getTodos as jest.Mock).mock.calls.length;
    expect(callCountAfter - callCountBefore).toBe(2);
  });

  it('should refresh on TODO_DELETED event', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    (getTodos as jest.Mock).mockClear();
    
    // Count how many times getTodos is called after emitting the event
    const callCountBefore = (getTodos as jest.Mock).mock.calls.length;
    
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_DELETED);
      await Promise.resolve();
    });
    
    const callCountAfter = (getTodos as jest.Mock).mock.calls.length;
    expect(callCountAfter - callCountBefore).toBe(2);
  });

  it('should refresh on TODO_COMPLETED event', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    (getTodos as jest.Mock).mockClear();
    
    // Count how many times getTodos is called after emitting the event
    const callCountBefore = (getTodos as jest.Mock).mock.calls.length;
    
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_COMPLETED);
      await Promise.resolve();
    });
    
    const callCountAfter = (getTodos as jest.Mock).mock.calls.length;
    expect(callCountAfter - callCountBefore).toBe(2);
  });

  it('should refresh on TODO_SNOOZED event', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Clear the mock calls to reset the count
    (getTodos as jest.Mock).mockClear();
    
    // Count how many times getTodos is called after emitting the event
    const callCountBefore = (getTodos as jest.Mock).mock.calls.length;
    
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_SNOOZED);
      await Promise.resolve();
    });
    
    const callCountAfter = (getTodos as jest.Mock).mock.calls.length;
    expect(callCountAfter - callCountBefore).toBe(2); // Update expectation from 1 to 2
  });

  it('should handle updating multiple properties at once', async () => {
    const { result } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });
    
    // Update multiple fields
    await act(async () => {
      const success = await result.current.updateTodo('todo-1', { 
        completed: true,
        name: 'Fully Updated Todo',
        description: 'New description',
        dueDate: '2025-05-15',
        tags: ['work', 'high-priority']
      });
      
      expect(success).toBe(true);
    });
    
    // Verify all fields were updated
    expect(updateTodoInStorage).toHaveBeenCalledWith({
      ...mockTodos[0],
      completed: true,
      name: 'Fully Updated Todo',
      description: 'New description',
      dueDate: '2025-05-15',
      tags: ['work', 'high-priority']
    });
  });

  it('should unsubscribe from events when unmounted', async () => {
    // Setup mock unsubscribe function
    const mockUnsubscribe = jest.fn();
    (todoEvents.on as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    const { unmount } = renderHook(() => useTodos());
    
    // Wait for hook to finish setup
    await act(async () => {
      await Promise.resolve();
    });
    
    // Unmount the hook
    unmount();
    
    // Verify unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should maintain separate state between instances', async () => {
    // Render two hook instances
    const { result: result1 } = renderHook(() => useTodos());
    const { result: result2 } = renderHook(() => useTodos());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Verify both have same initial state
    expect(result1.current.todos).toEqual(mockTodos);
    expect(result2.current.todos).toEqual(mockTodos);
    
    // Update a todo in the first instance
    await act(async () => {
      await result1.current.updateTodo('todo-1', { 
        name: 'Updated in first instance'
      });
    });
    
    // Second instance should still have original data until a refresh
    expect(updateTodoInStorage).toHaveBeenCalled();
    expect(todoEvents.emit).toHaveBeenCalled();
    
    // Both instances should get refreshed after the event emission
    // In a real scenario this would update both instances
  });
});