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
  Alert,
  Switch
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { FontAwesome } from '@expo/vector-icons';
import { Todo } from '@/types/todo';
import { PREDEFINED_TAGS, ALL_TAG_NAMES } from '@/constants/Tags';
import { addTodo, updateTodo } from '@/services/storage';
import { showToast } from '../utils/toastUtils';

// DateSelector Component
export interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
}

export const DateSelector = ({ value, onChange }: DateSelectorProps) => {
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

// ReminderSelector Component
export interface ReminderSelectorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  reminderTime: string;
  onTimeChange: (time: string) => void;
}

export const ReminderSelector = ({ enabled, onToggle, reminderTime, onTimeChange }: ReminderSelectorProps) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempSelectedTime, setTempSelectedTime] = useState(reminderTime);
  
  const handleToggle = (value: boolean) => {
    onToggle(value);
  };

  const selectPresetTime = (hours: number) => {
    const time = `${hours.toString().padStart(2, '0')}:00`;
    onTimeChange(time);
  };

  const handleCustomTime = () => {
    setTempSelectedTime(reminderTime);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setTempSelectedTime(time);
  };
  
  const handleConfirmTime = () => {
    onTimeChange(tempSelectedTime);
    setShowTimePicker(false);
  };
  
  const handleCancelTime = () => {
    setShowTimePicker(false);
  };

  return (
    <View style={styles.reminderContainer}>
      <View style={styles.reminderHeaderRow}>
        <Text style={styles.sectionLabel}>Reminder Notification:</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={enabled ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>
      
      {enabled && (
        <>
          <View style={styles.timeButtonRow}>
            <TouchableOpacity 
              style={[styles.timeButton, reminderTime === "09:00" ? styles.selectedTime : null]} 
              onPress={() => selectPresetTime(9)}
            >
              <Text>9:00 AM</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, reminderTime === "12:00" ? styles.selectedTime : null]} 
              onPress={() => selectPresetTime(12)}
            >
              <Text>12:00 PM</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timeButton, reminderTime === "18:00" ? styles.selectedTime : null]} 
              onPress={() => selectPresetTime(18)}
            >
              <Text>6:00 PM</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timeButtonRow}>
            <TouchableOpacity 
              style={[styles.timeButton, !["09:00", "12:00", "18:00"].includes(reminderTime) ? styles.selectedTime : null]} 
              onPress={handleCustomTime}
            >
              <Text>Custom Time</Text>
              <FontAwesome name="clock-o" size={14} color="#555" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </View>
          
          {reminderTime && (
            <Text style={styles.selectedTimeText}>
              You'll be reminded at {
                parseInt(reminderTime.split(':')[0]) > 12 
                  ? `${parseInt(reminderTime.split(':')[0]) - 12}:${reminderTime.split(':')[1]} PM`
                  : parseInt(reminderTime.split(':')[0]) === 12
                    ? `12:${reminderTime.split(':')[1]} PM`
                    : parseInt(reminderTime.split(':')[0]) === 0
                      ? `12:${reminderTime.split(':')[1]} AM`
                      : `${reminderTime} AM`
              }
            </Text>
          )}
          
          <Text style={styles.reminderNote}>
            Reminders will be sent before the due date
          </Text>
          
          <Text style={styles.reminderNote}>
            For tasks due today, you'll receive escalating reminders at 1 hour, 30 minutes, and 10 minutes before the deadline
          </Text>

          {/* Custom Time Picker Modal */}
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelTime}
          >
            <View style={styles.modalContainer}>
              <View style={styles.calendarContent}>
                <Text style={styles.modalTitle}>Select Custom Time</Text>
                
                <View style={styles.timePickerGrid}>
                  <View style={styles.timePickerHeader}>
                    <Text style={styles.timePickerHeaderText}>Hour</Text>
                    <Text style={styles.timePickerHeaderText}>Minute</Text>
                    <Text style={styles.timePickerHeaderText}>AM/PM</Text>
                  </View>
                  
                  <View style={styles.timePickerSelectors}>
                    {/* Hours */}
                    <ScrollView style={styles.timePickerColumnWrapper} showsVerticalScrollIndicator={false}>
                      {Array.from({length: 12}, (_, i) => (
                        <TouchableOpacity 
                          key={`hour-${i+1}`}
                          style={[
                            styles.timePickerOption,
                            (parseInt(tempSelectedTime.split(':')[0]) % 12 || 12) === i+1 ? styles.timeOptionSelected : null
                          ]}
                          onPress={() => {
                            const isPm = parseInt(tempSelectedTime.split(':')[0]) >= 12;
                            const newHour = isPm ? (i+1 === 12 ? 12 : i+1+12) : (i+1 === 12 ? 0 : i+1);
                            handleTimeSelect(newHour, parseInt(tempSelectedTime.split(':')[1]));
                          }}
                        >
                          <Text style={styles.timePickerOptionText}>{(i+1).toString().padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    {/* Minutes */}
                    <ScrollView style={styles.timePickerColumnWrapper} showsVerticalScrollIndicator={false}>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => (
                        <TouchableOpacity 
                          key={`minute-${minute}`}
                          style={[
                            styles.timePickerOption,
                            parseInt(tempSelectedTime.split(':')[1]) === minute ? styles.timeOptionSelected : null
                          ]}
                          onPress={() => handleTimeSelect(parseInt(tempSelectedTime.split(':')[0]), minute)}
                        >
                          <Text style={styles.timePickerOptionText}>{minute.toString().padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    {/* AM/PM */}
                    <View style={styles.timePickerColumnWrapper}>
                      <TouchableOpacity 
                        style={[
                          styles.timePickerOption, 
                          styles.ampmItem,
                          parseInt(tempSelectedTime.split(':')[0]) < 12 ? styles.timeOptionSelected : null
                        ]}
                        onPress={() => {
                          const currentHour = parseInt(tempSelectedTime.split(':')[0]);
                          if (currentHour >= 12) {
                            // Convert PM to AM
                            handleTimeSelect(currentHour - 12 === 0 ? 0 : currentHour - 12, parseInt(tempSelectedTime.split(':')[1]));
                          }
                        }}
                      >
                        <Text style={styles.timePickerOptionText}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.timePickerOption, 
                          styles.ampmItem,
                          parseInt(tempSelectedTime.split(':')[0]) >= 12 ? styles.timeOptionSelected : null
                        ]}
                        onPress={() => {
                          const currentHour = parseInt(tempSelectedTime.split(':')[0]);
                          if (currentHour < 12) {
                            // Convert AM to PM
                            handleTimeSelect(currentHour + 12 === 24 ? 12 : currentHour + 12, parseInt(tempSelectedTime.split(':')[1]));
                          }
                        }}
                      >
                        <Text style={styles.timePickerOptionText}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.selectedTimePreview}>
                    <Text style={styles.selectedTimePreviewText}>
                      Selected Time: {
                        parseInt(tempSelectedTime.split(':')[0]) > 12 
                          ? `${parseInt(tempSelectedTime.split(':')[0]) - 12}:${tempSelectedTime.split(':')[1]} PM`
                          : parseInt(tempSelectedTime.split(':')[0]) === 12
                            ? `12:${tempSelectedTime.split(':')[1]} PM`
                            : parseInt(tempSelectedTime.split(':')[0]) === 0
                              ? `12:${tempSelectedTime.split(':')[1]} AM`
                              : `${parseInt(tempSelectedTime.split(':')[0])}:${tempSelectedTime.split(':')[1]} AM`
                      }
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleCancelTime}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonConfirm]} 
                    onPress={handleConfirmTime}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
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
  // New reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

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
        // Set reminder values if they exist in the task
        if (initialTask.reminder) {
          setReminderEnabled(true);
          setReminderTime(initialTask.reminder.time || '09:00');
        } else {
          setReminderEnabled(false);
          setReminderTime('09:00');
        }
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
    setReminderEnabled(false);
    setReminderTime('09:00');
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
        // Add reminder data if enabled
        reminder: reminderEnabled ? {
          enabled: true,
          time: reminderTime
        } : undefined
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
        // Replace Alert with Toast
        showToast(isEditing ? "Task updated successfully" : "New task added successfully", 'info');
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
            <TouchableOpacity testID="close-button" onPress={handleClose}>
              <FontAwesome name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formScrollView}>
            <View style={styles.form}>
              <TextInput
                testID="task-name-input"
                style={styles.input}
                placeholder="What needs to be done? (#tag)"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                testID="task-description-input"
                style={styles.input}
                placeholder="Add details about this task (optional)"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={3}
              />
              
              <DateSelector value={dueDate} onChange={setDueDate} />
              
              {/* Reminder Selector - placed before advanced options */}
              <ReminderSelector 
                enabled={reminderEnabled}
                onToggle={setReminderEnabled}
                reminderTime={reminderTime}
                onTimeChange={setReminderTime}
              />
              
              {/* Advanced Settings Accordion */}
              <TouchableOpacity
                testID="advanced-options-toggle"
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
                        testID="tag-button"
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
                       <View testID="recurring-options" style={styles.recurringContainer}>
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
                  testID="save-button"
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
    width: '95%',
    maxHeight: '100%',
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
    width: '95%',
    maxHeight: '100%',
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
  reminderContainer: {
    marginBottom: 15,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  selectedTime: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  selectedTimeText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  reminderNote: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timePickerContainer: {
    maxHeight: 200,
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerColumnWrapper: {
    flex: 1,
    marginHorizontal: 5,
    height: 180,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  timeOptionSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  timePickerOptionText: {
    fontSize: 16,
  },
  timePickerGrid: {
    marginVertical: 15,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  timePickerHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timePickerSelectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 180,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 5,
    alignItems: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  timePickerText: {
    fontSize: 16,
  },
  ampmItem: {
    paddingVertical: 20,
    marginVertical: 10,
  },
  selectedTimePreview: {
    marginTop: 15,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedTimePreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 10,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtonConfirm: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
});
