import { useCallback, useMemo } from 'react';
import { Todo } from '@/types/todo';
import { getTodos, updateTodo as updateTodoInStorage } from '@/services/storage';
import { TODO_EVENTS, todoEvents } from '@/services/eventEmitter';
import { useEventEmitter } from './useEventEmitterHandler';

/**
 * Interface for the return value of useTodos hook
 */
interface UseTodosReturn {
  todos: Todo[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  incompleteTodos: Todo[];
  completedTodos: Todo[];
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<boolean>;
}

/**
 * Hook for managing todos with reactive updates
 */
export function useTodos(): UseTodosReturn {
  // Function to load todos from storage
  const fetchTodos = useCallback(async () => {
    return await getTodos();
  }, []);

  // Create refresh handler to be used for all events
  const createEventHandlers = useCallback(() => {
    // Single handler for all events - refreshes data
    const refresh = () => fetchTodos();
    
    // Map all relevant events to the refresh handler
    return {
      [TODO_EVENTS.STORAGE_CHANGED]: refresh,
      [TODO_EVENTS.TODO_ADDED]: refresh,
      [TODO_EVENTS.TODO_UPDATED]: refresh,
      [TODO_EVENTS.TODO_DELETED]: refresh,
      [TODO_EVENTS.TODO_COMPLETED]: refresh,
      [TODO_EVENTS.TODO_SNOOZED]: refresh
    };
  }, [fetchTodos]);

  // Use the generic event emitter hook
  const { data: todos, isLoading, refresh } = useEventEmitter<Todo[]>(
    createEventHandlers(),
    fetchTodos
  );

  // Function to update a todo
  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    // Find the todo to update
    const todoToUpdate = (todos || []).find(todo => todo.id === id);
    if (!todoToUpdate) return false;
    
    // Create updated todo
    const updatedTodo = { ...todoToUpdate, ...updates };
    
    // Call storage function to update
    const success = await updateTodoInStorage(updatedTodo);
    
    // Emit event to trigger refresh (although the hook should pick this up automatically)
    if (success) {
      todoEvents.emit(TODO_EVENTS.TODO_UPDATED, updatedTodo);
    }
    
    return success;
  }, [todos]);

  // Derive filtered todo lists
  const incompleteTodos = useMemo(() => 
    (todos || []).filter(todo => !todo.completed), 
    [todos]
  );
  
  const completedTodos = useMemo(() => 
    (todos || []).filter(todo => todo.completed), 
    [todos]
  );

  return {
    todos: todos || [],
    isLoading,
    refresh,
    incompleteTodos,
    completedTodos,
    updateTodo
  };
}
