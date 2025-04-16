import { renderHook, act } from '@testing-library/react-native';
import { useEventEmitter } from '../useEventEmitterHandler';
import { todoEvents, TODO_EVENTS } from '@/services/eventEmitter';

// Mock the event emitter
jest.mock('@/services/eventEmitter', () => ({
  TODO_EVENTS: {
    STORAGE_CHANGED: 'storage-changed',
    TODO_ADDED: 'todo-added',
    TODO_UPDATED: 'todo-updated',
    TODO_DELETED: 'todo-deleted',
    TODO_COMPLETED: 'todo-completed',
    TODO_SNOOZED: 'todo-snoozed',
    TAG_ADDED: 'tag-added',
    TAG_UPDATED: 'tag-updated',
    TAG_DELETED: 'tag-deleted',
    TAGS_CHANGED: 'tags-changed'
  },
  todoEvents: {
    emit: jest.fn(),
    on: jest.fn().mockImplementation(() => jest.fn()), // Return unsubscribe function
  }
}));

describe('useEventEmitter Hook', () => {
  const mockData = { test: 'data' };
  const mockInitialDataCallback = jest.fn().mockResolvedValue(mockData);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  
  it('should fetch initial data on mount', async () => {
    // Render the hook with mock callbacks
    const { result } = renderHook(() => useEventEmitter(
      { 'test-event': jest.fn() },
      mockInitialDataCallback
    ));
    
    // Initially should be loading with null data
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    
    // Wait for data to load
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should have loaded data and not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(mockInitialDataCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should register event listeners for each event in the eventMap', async () => {
    // Create event handlers
    const mockHandlers = {
      [TODO_EVENTS.TODO_ADDED]: jest.fn(),
      [TODO_EVENTS.TODO_UPDATED]: jest.fn()
    };
    
    // Render the hook with mock event handlers
    renderHook(() => useEventEmitter(
      mockHandlers,
      mockInitialDataCallback
    ));
    
    // Wait for hook to initialize
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should have registered listeners for all events in the map
    expect(todoEvents.on).toHaveBeenCalledTimes(2);
    expect(todoEvents.on).toHaveBeenCalledWith(TODO_EVENTS.TODO_ADDED, expect.any(Function));
    expect(todoEvents.on).toHaveBeenCalledWith(TODO_EVENTS.TODO_UPDATED, expect.any(Function));
  });
  
  it('should reload data when an event is emitted', async () => {
    // Reset mock to track new calls
    mockInitialDataCallback.mockClear();
    
    // Create updated mock data for second call
    const updatedMockData = { test: 'updated data' };
    mockInitialDataCallback
      .mockResolvedValueOnce(mockData)
      .mockResolvedValueOnce(updatedMockData);
    
    // Render the hook with a single event
    const { result } = renderHook(() => useEventEmitter(
      { [TODO_EVENTS.TODO_UPDATED]: jest.fn() },
      mockInitialDataCallback
    ));
    
    // Wait for initial data
    await act(async () => {
      await Promise.resolve();
    });
    
    // Verify initial data
    expect(result.current.data).toEqual(mockData);
    expect(mockInitialDataCallback).toHaveBeenCalledTimes(1);
    
    // Emit the event
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_UPDATED);
      await Promise.resolve();
    });
    
    // Should have reloaded data
    expect(mockInitialDataCallback).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(updatedMockData);
  });
  
  it('should call the event handler when an event is emitted', async () => {
    // Create event handler
    const mockHandler = jest.fn();
    
    // Render the hook with the handler
    renderHook(() => useEventEmitter(
      { [TODO_EVENTS.TODO_ADDED]: mockHandler },
      mockInitialDataCallback
    ));
    
    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });
    
    // Emit the event
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TODO_ADDED);
      await Promise.resolve();
    });
    
    // Handler should have been called
    expect(mockHandler).toHaveBeenCalled();
  });
  
  it('should call refresh function to reload data manually', async () => {
    // Reset mock to track new calls
    mockInitialDataCallback.mockClear();
    
    // Create different data for each call
    const firstData = { first: 'data' };
    const secondData = { second: 'data' };
    mockInitialDataCallback
      .mockResolvedValueOnce(firstData)
      .mockResolvedValueOnce(secondData);
    
    // Render the hook
    const { result } = renderHook(() => useEventEmitter(
      { [TODO_EVENTS.TODO_ADDED]: jest.fn() },
      mockInitialDataCallback
    ));
    
    // Wait for initial data
    await act(async () => {
      await Promise.resolve();
    });
    
    // Verify initial data
    expect(result.current.data).toEqual(firstData);
    expect(mockInitialDataCallback).toHaveBeenCalledTimes(1);
    
    // Call refresh manually
    await act(async () => {
      await result.current.refresh();
    });
    
    // Should have reloaded data
    expect(mockInitialDataCallback).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(secondData);
  });
  
  it('should handle errors during data fetching', async () => {
    // Mock console.error to avoid test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Make the callback throw an error
    const mockError = new Error('Test error');
    const errorCallback = jest.fn().mockRejectedValue(mockError);
    
    // Render the hook with the error-throwing callback
    const { result } = renderHook(() => useEventEmitter(
      { [TODO_EVENTS.TODO_ADDED]: jest.fn() },
      errorCallback
    ));
    
    // Wait for error to be caught
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should have handled error gracefully
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  it('should not update state if component unmounts during data fetch', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    const delayedCallback = jest.fn().mockImplementation(() => delayedPromise);
    
    // Render and unmount the hook immediately
    const { unmount } = renderHook(() => useEventEmitter(
      { [TODO_EVENTS.TODO_ADDED]: jest.fn() },
      delayedCallback
    ));
    
    // Unmount before promise resolves
    unmount();
    
    // Now resolve the promise
    await act(async () => {
      resolvePromise({ late: 'data' });
      await Promise.resolve();
    });
    
    // The callback should have been called, but no state updates should have happened
    // (no errors should be thrown about updating state on unmounted component)
    expect(delayedCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should unsubscribe from events on unmount', async () => {
    // Create a mock unsubscribe function
    const mockUnsubscribe = jest.fn();
    (todoEvents.on as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Render the hook
    const { unmount } = renderHook(() => useEventEmitter(
      { 
        [TODO_EVENTS.TODO_ADDED]: jest.fn(),
        [TODO_EVENTS.TODO_UPDATED]: jest.fn() 
      },
      mockInitialDataCallback
    ));
    
    // Wait for hook to initialize
    await act(async () => {
      await Promise.resolve();
    });
    
    // Unmount
    unmount();
    
    // Unsubscribe should have been called for each event
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});