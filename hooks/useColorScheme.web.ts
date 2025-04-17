import { useEffect, useState, useRef } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // Use a ref to track first render explicitly
  const isFirstRender = useRef(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const colorScheme = useRNColorScheme();

  useEffect(() => {
    // Ensure we mark first render as complete
    isFirstRender.current = false;
    
    // Delay hydration to ensure it happens after initial render
    const timer = setTimeout(() => {
      setHasHydrated(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Always return 'light' on first render, regardless of system theme
  if (isFirstRender.current || !hasHydrated) {
    return 'light';
  }

  return colorScheme;
}
