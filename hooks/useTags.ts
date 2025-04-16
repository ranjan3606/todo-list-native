import { useCallback, useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { getTags } from '@/services/storage';
import { TODO_EVENTS } from '@/services/eventEmitter';
import { useEventEmitter } from './useEventEmitterHandler';
import { PREDEFINED_TAGS } from '@/constants/Tags';

/**
 * Hook for managing tags with reactive updates
 */
export function useTags() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const slideAnim = useRef<{[key: string]: Animated.Value}>({});
  
  // Function to load tags from storage
  const fetchTags = useCallback(async () => {
    const storedTags = await getTags();
    
    // Use default tags if no stored tags
    if (Object.keys(storedTags).length === 0) {
      return PREDEFINED_TAGS;
    }
    
    return storedTags;
  }, []);

  // Create event handlers for tag-related events
  const createEventHandlers = useCallback(() => {
    return {
      [TODO_EVENTS.TAG_ADDED]: fetchTags,
      [TODO_EVENTS.TAG_UPDATED]: fetchTags,
      [TODO_EVENTS.TAG_DELETED]: fetchTags,
      [TODO_EVENTS.TAGS_CHANGED]: fetchTags
    };
  }, []);

  // Use the generic event emitter hook
  const { data: tags, isLoading, refresh } = useEventEmitter<Record<string, string[]>>(
    createEventHandlers(),
    fetchTags
  );
  
  // Initialize animation values when tags change
  useEffect(() => {
    if (!tags) return;
    
    Object.keys(tags).forEach(tagName => {
      if (!slideAnim.current[tagName]) {
        slideAnim.current[tagName] = new Animated.Value(100); // Start off-screen
      }
    });
  }, [tags]);
  
  // Toggle action buttons visibility with animation
  const toggleActionButtons = useCallback((tagName: string, show: boolean) => {
    // Close any previously open action buttons
    if (show && activeTag && activeTag !== tagName) {
      Animated.timing(slideAnim.current[activeTag], {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    if (!slideAnim.current[tagName]) {
      slideAnim.current[tagName] = new Animated.Value(show ? 100 : 0);
    }
    
    Animated.timing(slideAnim.current[tagName], {
      toValue: show ? 0 : 100,
      duration: 250,
      useNativeDriver: true,
    }).start();
    
    setActiveTag(show ? tagName : null);
  }, [activeTag]);

  // Handler for tag press
  const handleTagPress = useCallback((tagName: string) => {
    const isCurrentlyActive = activeTag === tagName;
    toggleActionButtons(tagName, !isCurrentlyActive);
  }, [activeTag, toggleActionButtons]);

  return {
    tags: tags || {},
    isLoading,
    refresh,
    activeTag,
    slideAnim: slideAnim.current,
    handleTagPress
  };
}
