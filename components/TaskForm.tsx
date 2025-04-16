import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { FontAwesome } from '@expo/vector-icons';
import { Todo } from '@/types/todo';
import { PREDEFINED_TAGS, ALL_TAG_NAMES } from '@/constants/Tags';
import { addTodo, updateTodo } from '@/services/storage';

// DateSelector Component
interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
}

const DateSelector = ({ value, onChange }: DateSelectorProps) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const selectPreset = (preset: string) => {
    let date = '';
    const today = new Date();

    switch(preset) {
      case 'today':
        date = today.toISOString().split('T')[0];
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
        break;
      case 'dayAfter':
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);
        date = dayAfter.toISOString().split('T')[0];
        break;
      default:
        setShowCalendar(true);
        return;
    }

    onChange(date);
  };

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    }
    setShowCalendar(false);
  };

  const formatDisplayDateInternal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.dateSelector}>
      <Text style={styles.dateLabel}>Due Date:</Text>
      
      <View style={styles.dateButtonRow}>
        <TouchableOpacity 
          style={[styles.dateButton, value && new Date(value).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? styles.selectedDate : null]} 
          onPress={() => selectPreset('today')}
        >
          <Text>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.dateButton, value && new Date(value).toISOString().split('T')[0] === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] ? styles.selectedDate : null]} 
          onPress={() => selectPreset('tomorrow')}
        >
          <Text>Tomorrow</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.dateButtonRow}>
        <TouchableOpacity 
          style={[styles.dateButton, value && new Date(value).toISOString().split('T')[0] === new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0] ? styles.selectedDate : null]} 
          onPress={() => selectPreset('dayAfter')}
        >
          <Text>Day After</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.dateButton, value && ![
            new Date().toISOString().split('T')[0],
            new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
            new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0]
          ].includes(new Date(value).toISOString().split('T')[0]) ? styles.selectedDate : null]} 
          onPress={() => setShowCalendar(true)}
        >
          <Text>Custom</Text>
        </TouchableOpacity>
      </View>
      
      {value && (
        <TouchableOpacity onPress={() => setShowCalendar(true)}>
          <Text style={styles.selectedDateText}>
            Selected: {formatDisplayDateInternal(value)}
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContent}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <CalendarPicker
              onDateChange={(date: Date) => handleDateSelect(date as Date)}
              initialDate={value ? new Date(value + 'T00:00:00') : new Date()}
              selectedStartDate={value ? new Date(value + 'T00:00:00') : undefined}
              minDate={new Date()}
              todayBackgroundColor="#f2e6ff"
              selectedDayColor="#7300e6"
              selectedDayTextColor="#FFFFFF"
              previousComponent={<FontAwesome name="chevron-left" size={18} color="#666" />}
              nextComponent={<FontAwesome name="chevron-right" size={18} color="#666" />}
            />

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setShowCalendar(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Main TaskForm component
interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  initialTask?: Todo;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  visible, 
  onClose, 
  initialTask 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [recurring, setRecurring] = useState<Todo['recurring']>('none');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form and set initial values if editing
  useEffect(() => {
    if (visible) {
      if (initialTask) {
        // Editing mode
        setName(initialTask.name);
        setDescription(initialTask.description || '');
        setDueDate(initialTask.dueDate);
        setTags(initialTask.tags || []);
        setRecurring(initialTask.recurring || 'none');
        setShowAdvanced(true);
        setIsEditing(true);
      } else {
        // Add mode - reset form
        resetForm();
      }
    }
  }, [visible, initialTask]);

  // Tag Auto-Suggestion Effect
  useEffect(() => {
    const suggestedTags: string[] = [];
    const lowerCaseName = name.toLowerCase();
    
    for (const tagName in PREDEFINED_TAGS) {
      if (PREDEFINED_TAGS[tagName].some(keyword => lowerCaseName.includes(keyword))) {
        if (!tags.includes(tagName)) {
          suggestedTags.push(tagName);
        }
      }
    }
    
    if (suggestedTags.length > 0) {
      setTags(prevTags => [...new Set([...prevTags, ...suggestedTags])]);
    }
  }, [name]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setDueDate('');
    setTags([]);
    setRecurring('none');
    setShowAdvanced(false);
    setIsEditing(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const toggleTag = (tag: string) => {
    setTags(prevTags =>
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      Alert.alert("Error", "Task name cannot be empty");
      return;
    }
    
    if (isSaving) return; // Prevent multiple submissions
    
    setIsSaving(true);
    
    try {
      const effectiveDueDate = dueDate || new Date().toISOString().split('T')[0];
      
      const taskToSave: Todo = {
        id: initialTask?.id || Date.now().toString(),
        name,
        description: description,
        dueDate: effectiveDueDate,
        completed: initialTask?.completed || false,
        tags: tags.length > 0 ? tags : [],
        recurring: recurring !== 'none' ? recurring : undefined,
        originalDueDate: initialTask?.originalDueDate || (recurring !== 'none' ? effectiveDueDate : undefined),
        isRecurringInstance: initialTask?.isRecurringInstance || false,
      };
      
      let success = false;
      
      if (initialTask) {
        // Update existing task
        success = await updateTodo(taskToSave);
      } else {
        // Add new task
        success = await addTodo(taskToSave);
      }
      
      if (success) {
        handleClose();
        Alert.alert(
          "Success", 
          isEditing ? "Task updated successfully" : "New task added successfully"
        );
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.formModal}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formScrollView}>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done? (#tag)"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Add details about this task (optional)"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={3}
              />
              
              <DateSelector value={dueDate} onChange={setDueDate} />
              
              {/* Advanced Settings Accordion */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text style={styles.accordionHeaderText}>Advanced Options</Text>
                <FontAwesome name={showAdvanced ? "chevron-up" : "chevron-down"} size={16} color="#666" />
              </TouchableOpacity>
              
              {showAdvanced && (
                <View style={styles.advancedOptionsContainer}>
                  {/* Tag Selector */}
                  <Text style={styles.sectionLabel}>Tags:</Text>
                  <View style={styles.tagContainer}>
                    {ALL_TAG_NAMES.map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tagButton,
                          tags.includes(tag) && styles.tagButtonSelected
                        ]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text style={[
                           styles.tagButtonText,
                           tags.includes(tag) && styles.tagButtonTextSelected
                        ]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Recurring Task Selector */}
                  {dueDate && (
                     <React.Fragment>
                       <Text style={styles.sectionLabel}>Recurring:</Text>
                       <View style={styles.recurringContainer}>
                         {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                           <TouchableOpacity
                             key={freq}
                             style={[
                               styles.recurringButton,
                               recurring === freq && styles.recurringButtonSelected
                             ]}
                             onPress={() => setRecurring(freq)}
                           >
                             <Text style={[
                                styles.recurringButtonText,
                                recurring === freq && styles.recurringButtonTextSelected
                             ]}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</Text>
                           </TouchableOpacity>
                         ))}
                       </View>
                     </React.Fragment>
                  )}
                </View>
              )}
              
              <View style={styles.formActions}>
                <Button 
                  title="Cancel" 
                  onPress={handleClose} 
                  color="#999" 
                />
                <Button 
                  title={isEditing ? (isSaving ? "Updating..." : "Update Task") : (isSaving ? "Adding..." : "Add Task")} 
                  onPress={handleSave}
                  disabled={isSaving} 
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  dateSelector: {
    marginBottom: 15,
  },
  dateLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  dateButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  selectedDate: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  selectedDateText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 15,
    marginBottom: 5,
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  advancedOptionsContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#444',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  tagButtonSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  tagButtonText: {
    color: '#555',
  },
  tagButtonTextSelected: {
    color: '#1890ff',
    fontWeight: '500',
  },
  recurringContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  recurringButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  recurringButtonSelected: {
    backgroundColor: '#e6fffb',
    borderColor: '#13c2c2',
  },
  recurringButtonText: {
    color: '#555',
  },
  recurringButtonTextSelected: {
    color: '#13c2c2',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formScrollView: {
    maxHeight: '95%',
    marginBottom: 10,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
