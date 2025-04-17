import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getTags, saveTags } from '@/services/storage';
import { todoEvents, TODO_EVENTS } from '@/services/eventEmitter';
import { useTranslation } from '@/i18n';

interface TagItemProps {
  tagName: string;
  keywords: string[];
  isActive: boolean;
  colorScheme: 'light' | 'dark';
  animValue?: Animated.Value; // Make animValue optional
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void; // Added onDelete prop for delete action
}

export const TagItem = ({
  tagName,
  keywords,
  isActive,
  colorScheme,
  animValue,
  onPress,
  onEdit,
  onDelete
}: TagItemProps) => {
  const { t } = useTranslation();
  
  // Create a default animation value if none is provided
  const defaultAnimValue = useRef(new Animated.Value(100)).current;
  const safeAnimValue = animValue || defaultAnimValue;
  
  return (
    <View style={[styles.tagItem, { backgroundColor: Colors[colorScheme].cardBackground }]}>
      <Pressable 
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        style={({ pressed }) => [
          styles.tagInfo,
          pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }
        ]}
      >
        <View style={styles.tagContent}>
          <Text style={[styles.tagName, { color: Colors[colorScheme].text }]}>
            {tagName}
          </Text>
          <Text style={[styles.tagKeywords, { color: Colors[colorScheme].lightText }]}>
            {keywords.join(', ')}
          </Text>
        </View>
        
        <Animated.View 
          style={[
            styles.animatedTagActions,
            { 
              transform: [{ translateX: safeAnimValue }] 
            }
          ]}
        >
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation(); // Stop event from bubbling up to parent
              onEdit();
            }} 
            style={styles.actionButton}
            testID="edit-tag-button"
            accessibilityRole="button"
          >
            <FontAwesome name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onDelete()} 
            style={styles.actionButton}
            testID="delete-tag-button"
            accessibilityRole="button"
          >
            <FontAwesome name="trash" size={18} color="red" />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tagItem: {
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  tagInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
  },
  tagContent: {
    flex: 1,
    padding: 5,
  },
  animatedTagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tagKeywords: {
    fontSize: 14,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
