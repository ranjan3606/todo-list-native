import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  FlatList
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getSnoozeDuration, saveSnoozeDuration } from '@/services/storage';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme, useThemePreference, saveThemePreference } from '@/services/theme';
import { TagItem } from '@/components/TagItem';
import { TagForm } from '@/components/TagForm';
import { ThemeSelector } from '@/components/ThemeSelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTags } from '@/hooks/useTags';
import { useTranslation } from '@/i18n';
import { useStableRefresh } from '@/hooks/useStableRefresh';
import { PageLayout } from '@/components/PageLayout';

export default function SettingsScreen() {
  const colorScheme = useActualColorScheme();
  const { t } = useTranslation();
  const [themePreference, setThemePreference] = useThemePreference();
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagKeywords, setNewTagKeywords] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState(24); 
  const [editingSnooze, setEditingSnooze] = useState(false);
  const [tempSnoozeDuration, setTempSnoozeDuration] = useState('24');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Use our custom tags hook
  const { tags, isLoading, refresh, activeTag, slideAnim, handleTagPress } = useTags();
  
  // Simplified refresh logic using custom hook
  useStableRefresh(refresh);
  
  // Load snooze duration
  useEffect(() => {
    const loadSnoozeDuration = async () => {
      const duration = await getSnoozeDuration();
      setSnoozeDuration(duration);
      setTempSnoozeDuration(duration.toString());
    };
    
    loadSnoozeDuration();
  }, []);

  // Open modal in add mode
  const openAddTagModal = () => {
    setModalMode('add');
    setNewTagCategory('');
    setNewTagKeywords('');
    setModalVisible(true);
  };
  
  // Open modal in edit mode
  const openEditTagModal = (tagName: string) => {
    setModalMode('edit');
    setNewTagCategory(tagName);
    setNewTagKeywords(tags[tagName].join(', '));
    setEditingTag(tagName);
    setModalVisible(true);
  };

  // Handle tag modal save
  const handleTagModalSave = () => {
    setNewTagCategory('');
    setNewTagKeywords('');
    setEditingTag(null);
    setModalVisible(false);
    refresh(); // Now we can call refresh directly since useStableRefresh ensures it's stable
  };
  
  const updateSnoozeDuration = async () => {
    const duration = parseInt(tempSnoozeDuration, 10);
    
    if (isNaN(duration) || duration < 1 || duration > 168) { // Max 1 week
      Alert.alert(t('settings.invalidDuration'), t('settings.durationRange'));
      return;
    }
    
    setSnoozeDuration(duration);
    await saveSnoozeDuration(duration);
    setEditingSnooze(false);
  };

  // Handle theme change
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    await saveThemePreference(theme);
  };
  
  return (
    <PageLayout title={t('settings.title')}>
      <ScrollView style={styles.scrollView}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            {t('settings.theme')}
          </Text>
          <ThemeSelector 
            currentTheme={themePreference} 
            colorScheme={colorScheme} 
            onThemeChange={handleThemeChange} 
          />
        </View>
        
        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            {t('settings.language')}
          </Text>
          <LanguageSelector colorScheme={colorScheme} />
        </View>
        
        {/* Snooze Duration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            {t('settings.snoozeDuration')}
          </Text>
          
          {!editingSnooze ? (
            <TouchableOpacity 
              style={[styles.settingRow, { backgroundColor: Colors[colorScheme].cardBackground }]}
              onPress={() => setEditingSnooze(true)}
            >
              <Text style={[styles.settingLabel, { color: Colors[colorScheme].text }]}>
                {t('settings.defaultSnoozeTime')}
              </Text>
              <View style={styles.settingValue}>
                <Text style={[styles.valueText, { color: Colors[colorScheme].text }]}>
                  {snoozeDuration} {snoozeDuration === 1 ? t('task.hour') : t('task.hours')}
                </Text>
                <FontAwesome name="pencil" size={16} color={Colors[colorScheme].text} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.editRow, { backgroundColor: Colors[colorScheme].cardBackground }]}>
              <TextInput
                style={[styles.durationInput, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }]}
                value={tempSnoozeDuration}
                onChangeText={setTempSnoozeDuration}
                keyboardType="number-pad"
              />
              <Text style={[styles.valueText, { color: Colors[colorScheme].text, marginHorizontal: 8 }]}>
                {parseInt(tempSnoozeDuration, 10) === 1 ? t('task.hour') : t('task.hours')}
              </Text>
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditingSnooze(false)} style={styles.actionButton}>
                  <FontAwesome name="times" size={20} color="red" />
                </TouchableOpacity>
                <TouchableOpacity onPress={updateSnoozeDuration} style={styles.actionButton}>
                  <FontAwesome name="check" size={20} color="green" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <Text style={[styles.helpText, { color: Colors[colorScheme].lightText }]}>
            {t('settings.snoozeHelpText')}
          </Text>
        </View>
        
        {/* Tags Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              {t('tags.title')}
            </Text>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: Colors.primary }]}
              onPress={openAddTagModal}
            >
              <FontAwesome name="plus" size={16} color="white" />
              <Text style={styles.addButtonText}>{t('tags.addTag')}</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
              {t('tags.loadingTags')}
            </Text>
          ) : Object.keys(tags).length > 0 ? (
            <FlatList
              data={Object.keys(tags)}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item: tagName }) => (
                <TagItem
                  tagName={tagName}
                  keywords={tags[tagName]}
                  isActive={activeTag === tagName}
                  colorScheme={colorScheme}
                  animValue={slideAnim[tagName]}
                  onPress={() => handleTagPress(tagName)}
                  onEdit={() => openEditTagModal(tagName)}
                />
              )}
            />
          ) : (
            <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
              {t('tags.noTags')}
            </Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors[colorScheme].lightText }]}>
            {t('app.name')} {t('app.version')}
          </Text>
        </View>
      </ScrollView>
      
      {/* Tag Modal */}
      <TagForm
        visible={modalVisible}
        colorScheme={colorScheme}
        mode={modalMode}
        tagName={newTagCategory}
        tagKeywords={newTagKeywords}
        onChangeTagName={setNewTagCategory}
        onChangeKeywords={setNewTagKeywords}
        onSave={handleTagModalSave}
        onCancel={() => setModalVisible(false)}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  durationInput: {
    width: 60,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 20,
    marginBottom: 20, // Reduced since PageLayout handles padding
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});
