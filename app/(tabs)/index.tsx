import React, { useState, useCallback } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Todo } from '@/types/todo';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';
import { categorizeTasks } from '@/utils/dateUtils';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { useTodos } from '@/hooks/useTodos';
import { useTranslation } from '@/i18n';
import { useStableRefresh } from '@/hooks/useStableRefresh';
import { PageLayout } from '@/components/PageLayout';

export default function HomeScreen() {
  const colorScheme = useActualColorScheme();
  const { t } = useTranslation();
  const [formVisible, setFormVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [editingTask, setEditingTask] = useState<Todo | undefined>(undefined);

  // Safety function to handle potential undefined translation keys
  const safeTranslate = (key: string, params?: Record<string, string | number>): string => {
    if (!t) return key; // Return the key if translation function is not available
    return t(key, params);
  };

  // Use our custom todos hook
  const { incompleteTodos, isLoading, refresh } = useTodos();
  
  // Simplified refresh logic using custom hook
  useStableRefresh(refresh);

  // Categorize tasks by due date
  const { today, tomorrow, upcoming, past } = categorizeTasks(incompleteTodos);
  const todayWithPast = [...past, ...today];

  // Open form for adding a new task
  const openAddTaskForm = () => {
    setEditingTask(undefined);
    setFormVisible(true);
  };

  // Open form for editing an existing task
  const openEditTaskForm = (task: Todo) => {
    setEditingTask(task);
    setFormVisible(true);
  };

  // Render a section header with count
  const renderSectionHeader = (title: string, count: number, section: 'today' | 'tomorrow' | 'upcoming') => (
    <TouchableOpacity 
      style={[
        styles.sectionHeader, 
        activeSection === section && styles.activeSectionHeader,
        { backgroundColor: activeSection === section ? 
            `${Colors[colorScheme].tint}15` : 'transparent' },
        // Add red background for today's tasks when there are pending tasks
        section === 'today' && count > 0 && styles.todayHighPriority
      ]}
      onPress={() => setActiveSection(section)}
    >
      <View style={styles.sectionTitleContainer}>
        <Text style={[
          styles.sectionTitle, 
          { color: Colors[colorScheme].text },
          activeSection === section && { color: Colors[colorScheme].tint },
          // Make text white when today section has high priority background
          section === 'today' && count > 0 && styles.todayHighPriorityText
        ]}>
          {title}
        </Text>
        
        {/* Add notification badge for pending tasks */}
        {section === 'today' && count > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>
              {count}
            </Text>
          </View>
        )}
      </View>
      <FontAwesome 
        name={activeSection === section ? "chevron-down" : "chevron-right"} 
        size={16} 
        color={
          section === 'today' && count > 0 ? 
            '#fff' : 
            (activeSection === section ? Colors[colorScheme].tint : Colors[colorScheme].text)
        } 
      />
    </TouchableOpacity>
  );

  // Render a task item
  const renderTaskItem = (item: Todo) => {
    return (
      <TaskCard 
        item={item}
        colorScheme={colorScheme as 'light' | 'dark'}
        onEdit={openEditTaskForm}
      />
    );
  };

  return (
    <PageLayout title={safeTranslate('tabs.home')}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>{safeTranslate('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Today's Tasks (including past tasks) */}
          {renderSectionHeader(safeTranslate('task.today'), todayWithPast.length, 'today')}
          {activeSection === 'today' && (
            todayWithPast.length > 0 ? (
              todayWithPast.map(item => (
                <React.Fragment key={item.id}>
                  {renderTaskItem(item)}
                </React.Fragment>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
                {safeTranslate('task.noTasksToday')}
              </Text>
            )
          )}
          
          {/* Tomorrow's Tasks */}
          {renderSectionHeader(safeTranslate('task.tomorrow'), tomorrow.length, 'tomorrow')}
          {activeSection === 'tomorrow' && (
            tomorrow.length > 0 ? (
              tomorrow.map(item => (
                <React.Fragment key={item.id}>
                  {renderTaskItem(item)}
                </React.Fragment>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
                {safeTranslate('task.noTasksTomorrow')}
              </Text>
            )
          )}
          
          {/* Upcoming Tasks */}
          {renderSectionHeader(safeTranslate('task.upcoming'), upcoming.length, 'upcoming')}
          {activeSection === 'upcoming' && (
            upcoming.length > 0 ? (
              upcoming.map(item => (
                <React.Fragment key={item.id}>
                  {renderTaskItem(item)}
                </React.Fragment>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
                {safeTranslate('task.noUpcomingTasks')}
              </Text>
            )
          )}
        </ScrollView>
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Colors.primary }]} 
        onPress={openAddTaskForm}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
      
      {/* Task Form Modal */}
      <TaskForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        initialTask={editingTask}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    marginVertical: 15,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center', 
    right: 20,
    bottom: 80,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    paddingBottom: 60, // Reduced padding since PageLayout handles spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 8,
    borderRadius: 6,
  },
  activeSectionHeader: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  notificationText: {
    color: 'red',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todayHighPriority: {
    backgroundColor: Colors.danger,
    borderLeftWidth: 0, // Override the active border when showing high priority
  },
  todayHighPriorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
});