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
}

export const TagItem = ({
  tagName,
  keywords,
  isActive,
  colorScheme,
  animValue,
  onPress,
  onEdit
}: TagItemProps) => {
  const { t } = useTranslation();
  
  // Create a default animation value if none is provided
  const defaultAnimValue = useRef(new Animated.Value(100)).current;
  const safeAnimValue = animValue || defaultAnimValue;
  
  const handleDelete = async () => {
    Alert.alert(
      t('tags.deleteTag'),
      t('tags.deleteConfirm', { name: tagName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Get current tags
              const currentTags = await getTags();
              // Create a new object without the deleted tag
              const { [tagName]: removed, ...updatedTags } = currentTags;
              
              // Save updated tags
              await saveTags(updatedTags);
              
              // Emit tag deleted event
              todoEvents.emit(TODO_EVENTS.TAG_DELETED, { name: tagName });
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert(t('common.error'), t('tags.deleteError'));
            }
          }
        }
      ]
    );
  };
  
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
            onPress={onEdit} 
            style={styles.actionButton}
            testID="edit-tag-button"
            accessibilityRole="button"
          >
            <FontAwesome name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete} 
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
