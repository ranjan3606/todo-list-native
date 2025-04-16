import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getTags, saveTags } from '@/services/storage';
import { todoEvents, TODO_EVENTS } from '@/services/eventEmitter';
import { useTranslation } from '@/i18n';

interface TagModalProps {
  visible: boolean;
  colorScheme: 'light' | 'dark';
  mode: 'add' | 'edit';
  tagName: string;
  tagKeywords: string;
  onChangeTagName: (text: string) => void;
  onChangeKeywords: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const TagForm = ({
  visible,
  colorScheme,
  mode,
  tagName,
  tagKeywords,
  onChangeTagName,
  onChangeKeywords,
  onSave,
  onCancel
}: TagModalProps) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (isSaving) return;
    
    if (!tagName.trim()) {
      Alert.alert(t('common.error'), t('tags.nameRequired'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Convert comma-separated string to array and trim each keyword
      const keywords = tagKeywords.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      // Check if any keyword doesn't start with #
      const formattedKeywords = keywords.map(k => 
        k.startsWith('#') ? k : `#${k}`
      );
      
      // Get current tags
      const currentTags = await getTags();
      let updatedTags = { ...currentTags };
      
      // Update tags based on mode
      if (mode === 'add') {
        // Check if tag already exists
        if (updatedTags[tagName]) {
          Alert.alert(t('common.error'), t('tags.alreadyExists', { name: tagName }));
          setIsSaving(false);
          return;
        }
        
        updatedTags[tagName] = formattedKeywords;
        
        // Emit tag added event
        todoEvents.emit(TODO_EVENTS.TAG_ADDED, { name: tagName, keywords: formattedKeywords });
      } else {
        // Edit existing tag
        updatedTags[tagName] = formattedKeywords;
        
        // Emit tag updated event
        todoEvents.emit(TODO_EVENTS.TAG_UPDATED, { name: tagName, keywords: formattedKeywords });
      }
      
      // Save updated tags
      await saveTags(updatedTags);
      
      // Call the original onSave callback
      onSave();
    } catch (error) {
      console.error('Error saving tag:', error);
      Alert.alert(t('common.error'), t('tags.saveError'));
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={[styles.modalOverlay, { backgroundColor: Colors[colorScheme].modalBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
            {mode === 'add' ? t('tags.addTag') : t('tags.editTag')}
          </Text>
          
          <TextInput
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
            placeholder={t('tags.tagName')}
            placeholderTextColor={Colors[colorScheme].lightText}
            value={tagName}
            onChangeText={onChangeTagName}
            editable={mode === 'add'} // Only editable in add mode
          />
          
          <TextInput
            style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
            placeholder={t('tags.keywords')}
            placeholderTextColor={Colors[colorScheme].lightText}
            value={tagKeywords}
            onChangeText={onChangeKeywords}
            multiline={true}
            numberOfLines={3}
          />
          
          <Text style={[styles.helpText, { color: Colors[colorScheme].lightText }]}>
            {t('tags.keywordsHelp')}
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton, isSaving && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? t('common.saving') : (mode === 'add' ? t('common.save') : t('common.update'))}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
