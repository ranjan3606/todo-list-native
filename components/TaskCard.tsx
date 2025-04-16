import React, { useState, memo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Todo } from '@/types/todo';
import { SwipeableRow, SwipeableRowHandle } from './SwipeableRow';
import { formatDisplayDate, isToday, isTomorrow, isDueSoon, getNextDueDate } from '@/utils/dateUtils';
import { deleteTodo, toggleTodoCompletion, snoozeTodo, getSnoozeDuration, addTodo } from '@/services/storage';
import { useTranslation } from '@/i18n';
import { showToast } from '@/utils/toastUtils';

interface TaskCardProps {
  item: Todo;
  colorScheme: 'light' | 'dark';
  onEdit?: (task: Todo) => void;
}

export const TaskCard: React.FC<TaskCardProps> = memo(({ 
  item, 
  colorScheme,
  onEdit
}) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isDueToday = isToday(item.dueDate);
  const isDueTomorrow = isTomorrow(item.dueDate);
  const isDue = isDueSoon(item.dueDate);
  // Add a ref for the SwipeableRow
  const swipeableRowRef = useRef<SwipeableRowHandle>(null);

  const handleLongPress = useCallback(() => {
    if (onEdit) {
      Alert.alert(
        t('task.edit'),
        t('task.deleteConfirm'),
        [
          { text: t('common.cancel'), style: "cancel" },
          { text: t('common.edit'), onPress: () => onEdit(item) },
          { text: t('common.delete'), onPress: () => handleDelete(), style: "destructive" }
        ]
      );
    }
  }, [onEdit, item, t]);

  const handleDelete = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await deleteTodo(item.id);
      if (!success) {
        Alert.alert(t('common.error'), t('taskForm.error'));
      } else {
        // Show toast notification when task is deleted successfully with direct message format
        showToast(`"${item.name}" deleted successfully`, 'success');
      }
      setShowDetails(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('taskForm.error'));
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, item.id, item.name, t]);

  const handleComplete = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await toggleTodoCompletion(item.id);
      
      // Show toast notification when task is completed or uncompleted
      if (result.success && result.newTodo) {
        if (result.newTodo.completed) {
          showToast(`"${item.name}" marked as complete`, 'success');
        } else {
          showToast(`"${item.name}" marked as incomplete`, 'info');
        }
      }
      
      // Handle recurring task completion
      if (result.success && result.newTodo && result.newTodo.completed && 
          result.newTodo.recurring && result.newTodo.recurring !== 'none') {
        
        const nextDate = getNextDueDate(result.newTodo.dueDate, result.newTodo.recurring);
        
        if (nextDate !== result.newTodo.dueDate) {
          const nextTodoInstance: Todo = {
            ...result.newTodo,
            id: Date.now().toString(),
            dueDate: nextDate,
            completed: false,
            originalDueDate: result.newTodo.originalDueDate || result.newTodo.dueDate,
            isRecurringInstance: true,
          };
          
          // Add the next instance to storage
          await addTodo(nextTodoInstance);
        }
      }
      
      setShowDetails(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('task.error'));
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, item.id, item.name, t]);

  const handleSnooze = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const snoozeDuration = await getSnoozeDuration();
      const result = await snoozeTodo(item.id, snoozeDuration);
      
      if (result.success && result.newDueDate) {
        const hours = snoozeDuration === 1 ? 
          t('task.hour') : 
          `${snoozeDuration} ${t('task.hours')}`;
        
        Alert.alert(
          t('task.snoozed'), 
          t('task.snoozedFor', { hours })
        );
      } else {
        Alert.alert(t('common.error'), t('taskForm.error'));
      }
      
      setShowDetails(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('taskForm.error'));
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, item.id, t]);

  // Task detail popup component
  const TaskDetailPopup = () => (
    <Modal
      visible={showDetails}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDetails(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowDetails(false)}
      >
        <View 
          style={[
            styles.modalContent, 
            { backgroundColor: Colors[colorScheme].cardBackground }
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Task title and description */}
          <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
            {item.name}
          </Text>
          
          {item.description ? (
            <Text style={[styles.modalDescription, { color: Colors[colorScheme].text }]}>
              {item.description}
            </Text>
          ) : null}
          
          {/* Due date info */}
          {item.dueDate && (
            <View style={styles.modalInfoRow}>
              <FontAwesome name="calendar" size={16} color={Colors[colorScheme].lightText} />
              <Text style={[styles.modalInfoText, { color: Colors[colorScheme].text }]}>
                {t('task.due', { date: formatDisplayDate(item.dueDate) })}
              </Text>
            </View>
          )}
          
          {/* Recurring info */}
          {item.recurring && item.recurring !== 'none' && (
            <View style={styles.modalInfoRow}>
              <FontAwesome name="repeat" size={16} color={Colors[colorScheme].lightText} />
              <Text style={[styles.modalInfoText, { color: Colors[colorScheme].text }]}>
                {t(`taskForm.${item.recurring}`)}
              </Text>
            </View>
          )}
          
          {/* Original due date for recurring tasks */}
          {item.isRecurringInstance && item.originalDueDate && (
            <View style={styles.modalInfoRow}>
              <FontAwesome name="history" size={16} color={Colors[colorScheme].lightText} />
              <Text style={[styles.modalInfoText, { color: Colors[colorScheme].text }]}>
                {t('task.originally', { date: formatDisplayDate(item.originalDueDate) })}
              </Text>
            </View>
          )}
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.modalTagsContainer}>
              {item.tags.map(tag => (
                <Text key={tag} style={[
                  styles.itemTag,
                  { 
                    color: Colors[colorScheme].tint,
                    backgroundColor: `${Colors[colorScheme].tint}15`,
                  }
                ]}>
                  {tag}
                </Text>
              ))}
            </View>
          )}
          
          {/* Action buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={() => {
                setShowDetails(false);
                if (onEdit) onEdit(item);
              }}
              testID="edit-task-button"
            >
              <FontAwesome name="edit" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>{t('common.edit')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: item.completed ? Colors.primary : Colors.success }]}
              onPress={handleComplete}
              disabled={isProcessing}
              testID="modal-complete-button"
            >
              <FontAwesome name={item.completed ? "undo" : "check"} size={18} color="#fff" />
              <Text style={styles.modalButtonText}>
                {item.completed ? t('task.unmark') : t('task.markComplete')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.warning }]}
              onPress={handleSnooze}
              disabled={isProcessing}
              testID="snooze-button"
            >
              <FontAwesome name="clock-o" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>{t('task.snooze')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: Colors.danger }]}
              onPress={handleDelete}
              disabled={isProcessing}
              testID="delete-button"
            >
              <FontAwesome name="trash" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderCardContent = () => (
    <TouchableOpacity 
      style={[
        styles.todoItem, 
        { backgroundColor: Colors[colorScheme].cardBackground },
        isDueToday && styles.todayTask,
        isDueTomorrow && styles.tomorrowTask,
        isDue && !isDueToday && !isDueTomorrow && styles.upcomingTask,
        item.completed && styles.completedTask
      ]}
      onLongPress={handleLongPress}
      delayLongPress={500}
      onPress={() => setShowDetails(true)}
      testID="task-card" 
    >
      <View style={styles.todoContent}>
        {/* Priority Indicator for Today's Tasks */}
        {isDueToday && !item.completed && (
          <View style={styles.priorityIndicator}>
            <Text style={styles.priorityText}>!</Text>
          </View>
        )}

        {/* Completion Icon */}
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation(); // Prevent the card's onPress from firing
            handleComplete();
          }} 
          style={styles.checkIcon}
          testID="completion-checkbox"
        >
          <FontAwesome
            name={item.completed ? "check-circle" : "circle-o"}
            size={24}
            color={item.completed ? Colors.success : (isDue ? Colors[colorScheme].dueSoon : "#ccc")}
          />
        </TouchableOpacity>
        
        {/* Task Text and Info */}
        <View style={styles.todoTextContainer}>
          <Text style={[
            styles.todoName, 
            { color: Colors[colorScheme].text },
            item.completed && styles.completedText,
            isDueToday && !item.completed && styles.todayTaskText
          ]}>
            {item.name}
          </Text>
          
          {item.description ? (
            <Text style={[
              styles.todoDesc, 
              { color: Colors[colorScheme].lightText },
              item.completed && styles.completedText
            ]}>
              {item.description}
            </Text>
          ) : null}
          
          {/* Display Due Date and Recurrence */}
          <View style={styles.dateRecurrenceContainer}>
            {item.dueDate ? (
              <Text style={[
                styles.todoDate,
                { 
                  color: isDueToday && !item.completed ? 
                    Colors[colorScheme].dueSoon : 
                    Colors[colorScheme].lightText 
                },
                item.completed && styles.completedText
              ]}>
                {t('task.due', { date: formatDisplayDate(item.dueDate) })}
              </Text>
            ) : null}
            
            {/* Reminder badge */}
            {item.reminder && item.reminder.enabled && !item.completed && (
              <View style={styles.reminderBadge} testID="reminder-badge">
                <FontAwesome name="bell" size={12} color="#fff" />
                <Text style={styles.reminderText}>{item.reminder.time}</Text>
              </View>
            )}
            
            {item.isRecurringInstance && item.originalDueDate && (
              <Text style={[
                styles.todoDate, 
                { 
                  fontStyle: 'italic', 
                  marginLeft: 5,
                  color: Colors[colorScheme].lightText
                },
                item.completed && styles.completedText
              ]}>
                {t('task.originally', { date: formatDisplayDate(item.originalDueDate) })}
              </Text>
            )}
            
            {item.recurring && item.recurring !== 'none' && (
              <Text style={[
                styles.recurringText, 
                { color: Colors[colorScheme].lightText },
                item.completed && styles.completedText
              ]}
              testID="recurring-indicator">
                <FontAwesome name="repeat" size={12} color={Colors[colorScheme].lightText} /> 
                {t(`taskForm.${item.recurring}`)}
              </Text>
            )}
          </View>
          
          {/* Display Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.itemTagContainer} testID="tags-container">
              {item.tags.map(tag => (
                <Text key={tag} style={[
                  styles.itemTag,
                  { 
                    color: Colors[colorScheme].tint,
                    backgroundColor: `${Colors[colorScheme].tint}15`,
                    opacity: item.completed ? 0.7 : 1
                  },
                  item.completed && styles.completedText
                ]}>
                  {tag}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <SwipeableRow 
        ref={swipeableRowRef}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onSnooze={handleSnooze}
        isCompleted={item.completed}
      >
        {renderCardContent()}
      </SwipeableRow>
      
      {/* Detail Popup */}
      <TaskDetailPopup />
    </>
  );
});

const styles = StyleSheet.create({
  todoItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 5,
  },
  completedTask: {
    opacity: 0.8,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkIcon: {
    paddingRight: 10,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  todoDesc: {
    marginTop: 5,
  },
  todoDate: {
    marginTop: 5,
  },
  dateRecurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  recurringText: {
    marginLeft: 10,
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  itemTag: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 5,
    marginBottom: 3,
  },
  todayTask: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  tomorrowTask: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  upcomingTask: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '95%',
    maxWidth: 400,
    borderRadius: 10,
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
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    marginLeft: 10,
    fontSize: 14,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '48%',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayTaskText: {
    fontWeight: 'bold',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 10,
  },
  reminderText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
});
