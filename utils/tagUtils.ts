/**
 * Utility functions for tag management
 */

/**
 * Format a list of keywords to ensure they start with #
 * @param keywords Array of keywords to format
 * @returns Array of formatted keywords
 */
export const formatTagKeywords = (keywords: string[]): string[] => {
  return keywords
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .map(k => k.startsWith('#') ? k : `#${k}`);
};

/**
 * Convert comma-separated string to array of keywords
 * @param keywordsString Comma-separated keywords string
 * @returns Array of formatted keywords
 */
export const parseKeywordsString = (keywordsString: string): string[] => {
  const keywords = keywordsString
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
    
  return formatTagKeywords(keywords);
};

/**
 * Create animation values for a set of tags
 * @param tags Object containing tag names as keys
 * @param currentAnimValues Existing animation values
 * @param defaultValue Default animation value
 * @returns Updated animation values object
 */
export const initializeTagAnimations = (
  tags: Record<string, any>,
  currentAnimValues: Record<string, any>,
  defaultValue: number
): Record<string, any> => {
  const updatedAnimValues = { ...currentAnimValues };
  
  Object.keys(tags).forEach(tagName => {
    if (!updatedAnimValues[tagName]) {
      updatedAnimValues[tagName] = new Animated.Value(defaultValue);
    }
  });
  
  return updatedAnimValues;
};
