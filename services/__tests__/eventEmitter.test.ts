import { EventEmitter, todoEvents, TODO_EVENTS } from '../eventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    // Create a fresh EventEmitter instance for each test
    emitter = new EventEmitter();
  });

  describe('Basic Functionality', () => {
    it('should create an instance correctly', () => {
      expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it('should have empty events object initially', () => {
      // @ts-ignore - accessing private property for testing
      expect(emitter.events).toEqual({});
    });
  });

  describe('on() method', () => {
    it('should register an event listener', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toContain(callback);
    });

    it('should handle multiple listeners for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test', callback1);
      emitter.on('test', callback2);

      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toHaveLength(2);
      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toEqual([callback1, callback2]);
    });

    it('should return an unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = emitter.on('test', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe when the returned function is called', () => {
      const callback = jest.fn();
      const unsubscribe = emitter.on('test', callback);

      // Unsubscribe
      unsubscribe();

      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).not.toContain(callback);
      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toHaveLength(0);
    });

    it('should handle multiple unsubscribes correctly', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = emitter.on('test', callback1);
      const unsubscribe2 = emitter.on('test', callback2);

      // Unsubscribe the first callback
      unsubscribe1();

      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toHaveLength(1);
      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toContain(callback2);
      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).not.toContain(callback1);

      // Unsubscribe the second callback
      unsubscribe2();

      // @ts-ignore - accessing private property for testing
      expect(emitter.events['test']).toHaveLength(0);
    });
  });

  describe('emit() method', () => {
    it('should call registered callbacks when an event is emitted', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      
      emitter.emit('test');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to callbacks', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      
      const arg1 = { id: '123' };
      const arg2 = 'test-string';
      
      emitter.emit('test', arg1, arg2);
      
      expect(callback).toHaveBeenCalledWith(arg1, arg2);
    });

    it('should call all registered callbacks for an event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      
      emitter.emit('test');
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not call callbacks for other events', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      
      emitter.emit('test1');
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle emitting events with no registered listeners', () => {
      // This should not throw an error
      expect(() => {
        emitter.emit('non-existent-event');
      }).not.toThrow();
    });

    it('should not call unsubscribed listeners', () => {
      const callback = jest.fn();
      const unsubscribe = emitter.on('test', callback);
      
      // Unsubscribe
      unsubscribe();
      
      // Emit the event
      emitter.emit('test');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Integration with TODO_EVENTS', () => {
    it('should export a const object of event types', () => {
      expect(TODO_EVENTS).toBeDefined();
      expect(typeof TODO_EVENTS).toBe('object');
    });

    it('should contain all expected event types', () => {
      expect(TODO_EVENTS.TODO_ADDED).toBe('todo_added');
      expect(TODO_EVENTS.TODO_UPDATED).toBe('todo_updated');
      expect(TODO_EVENTS.TODO_DELETED).toBe('todo_deleted');
      expect(TODO_EVENTS.TODO_COMPLETED).toBe('todo_completed');
      expect(TODO_EVENTS.TODO_SNOOZED).toBe('todo_snoozed');
      expect(TODO_EVENTS.STORAGE_CHANGED).toBe('storage_changed');
      expect(TODO_EVENTS.TAG_ADDED).toBe('tag_added');
      expect(TODO_EVENTS.TAG_UPDATED).toBe('tag_updated');
      expect(TODO_EVENTS.TAG_DELETED).toBe('tag_deleted');
      expect(TODO_EVENTS.TAGS_CHANGED).toBe('tags_changed');
    });
  });

  describe('todoEvents singleton', () => {
    it('should export a singleton instance of EventEmitter', () => {
      expect(todoEvents).toBeInstanceOf(EventEmitter);
    });

    it('should work correctly with the singleton', () => {
      const callback = jest.fn();
      todoEvents.on(TODO_EVENTS.TODO_ADDED, callback);
      
      const todo = { id: 'test-id', name: 'Test Todo' };
      todoEvents.emit(TODO_EVENTS.TODO_ADDED, todo);
      
      expect(callback).toHaveBeenCalledWith(todo);
    });

    it('should handle unsubscribes with the singleton', () => {
      const callback = jest.fn();
      const unsubscribe = todoEvents.on(TODO_EVENTS.TODO_UPDATED, callback);
      
      // Unsubscribe
      unsubscribe();
      
      // Emit the event
      todoEvents.emit(TODO_EVENTS.TODO_UPDATED, { id: 'test' });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complex event flow with multiple subscribers and events', () => {
      const todoAddedCallback1 = jest.fn();
      const todoAddedCallback2 = jest.fn();
      const todoUpdatedCallback = jest.fn();
      const todoDeletedCallback = jest.fn();
      
      // Subscribe to events
      const unsubscribeAdd1 = todoEvents.on(TODO_EVENTS.TODO_ADDED, todoAddedCallback1);
      todoEvents.on(TODO_EVENTS.TODO_ADDED, todoAddedCallback2);
      todoEvents.on(TODO_EVENTS.TODO_UPDATED, todoUpdatedCallback);
      todoEvents.on(TODO_EVENTS.TODO_DELETED, todoDeletedCallback);
      
      // Emit added event
      const newTodo = { id: 'new-todo', name: 'New Todo' };
      todoEvents.emit(TODO_EVENTS.TODO_ADDED, newTodo);
      
      // Unsubscribe one listener
      unsubscribeAdd1();
      
      // Emit updated event
      const updatedTodo = { id: 'new-todo', name: 'Updated Todo' };
      todoEvents.emit(TODO_EVENTS.TODO_UPDATED, updatedTodo);
      
      // Emit added event again (after one listener unsubscribed)
      todoEvents.emit(TODO_EVENTS.TODO_ADDED, { id: 'another-todo' });
      
      // Verify calls
      expect(todoAddedCallback1).toHaveBeenCalledTimes(1);
      expect(todoAddedCallback2).toHaveBeenCalledTimes(2);
      expect(todoUpdatedCallback).toHaveBeenCalledTimes(1);
      expect(todoDeletedCallback).not.toHaveBeenCalled();
      
      // Verify parameters
      expect(todoAddedCallback1).toHaveBeenCalledWith(newTodo);
      expect(todoUpdatedCallback).toHaveBeenCalledWith(updatedTodo);
    });
  });
});