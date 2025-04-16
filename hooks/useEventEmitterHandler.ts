import { useState, useEffect, useRef, useCallback } from 'react';
import { Todo } from '@/types/todo';
import { todoEvents, TODO_EVENTS } from '@/services/eventEmitter';
import { getTodos } from '@/services/storage';

/**
 * Generic hook for subscribing to event emitter events
 * @param eventMap Object mapping event names to handler functions
 * @param initialDataCallback Function to fetch initial data
 */
export function useEventEmitter<T>(
  eventMap: Record<string, () => void>,
  initialDataCallback: () => Promise<T>
): {
  data: T | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMounted = useRef(true);
  
  // Store the event handlers in a ref to maintain stability across renders
  const eventHandlersRef = useRef(eventMap);
  
  // Update ref if eventMap changes (keeping the reference stable in the dependency array)
  useEffect(() => {
    eventHandlersRef.current = eventMap;
  }, [eventMap]);

  // Memoize the callback to prevent recreation on every render
  const memoizedInitialDataCallback = useCallback(initialDataCallback, []);

  // Function to load data
  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    try {
      const result = await memoizedInitialDataCallback();
      if (isMounted.current) {
        setData(result);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [memoizedInitialDataCallback]);

  // Set up event listeners
  useEffect(() => {
    isMounted.current = true;
    
    // Initial data load
    loadData();
    
    // Get the events we need to subscribe to (only names)
    const eventNames = Object.keys(eventHandlersRef.current);
    
    // Subscribe to events using the ref to prevent dependency changes
    const unsubscribers = eventNames.map(event => 
      todoEvents.on(event, () => {
        if (isMounted.current) {
          // Call loadData to refresh data when any event is triggered
          loadData();
          
          // Get the most up-to-date handler from the ref and execute it
          const handler = eventHandlersRef.current[event];
          if (handler) {
            handler();
          }
        }
      })
    );
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [loadData]); // Only loadData as dependency, not eventMap

  return {
    data,
    isLoading,
    refresh: loadData
  };
}
