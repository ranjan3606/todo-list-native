import { useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Custom hook to use a refresh function that remains stable across renders
 * and gets called when the screen comes into focus.
 * 
 * @param refreshFn The refresh function to be called
 * @returns void
 */
export function useStableRefresh(refreshFn: () => void): void {
  // Store the function in a ref to keep it stable
  const refreshRef = useRef(refreshFn);
  
  // Update the ref when the function changes
  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);
  
  // Call the function when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
      return () => {};
    }, [])
  );
}
