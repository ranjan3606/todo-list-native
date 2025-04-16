import { useCallback, useMemo } from 'react';
import { Todo } from '@/types/todo';
import { getTodos } from '@/services/storage';
import { TODO_EVENTS } from '@/services/eventEmitter';
import { useEventEmitter } from './useEventEmitterHandler';

/**
 * Hook for managing todos with reactive updates
 */
export function useTodos() {
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
    completedTodos
  };
}
