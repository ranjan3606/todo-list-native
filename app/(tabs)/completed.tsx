import { useState, useCallback, memo } from 'react';
import { 
  Text, 
  View, 
  FlatList, 
  StyleSheet, 
  Alert
} from 'react-native';
import { Todo } from '@/types/todo';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { useTodos } from '@/hooks/useTodos';
import { useTranslation } from '@/i18n';
import { useStableRefresh } from '@/hooks/useStableRefresh';
import { PageLayout } from '@/components/PageLayout';

// Memoized task card component for better list performance
const MemoizedTaskCard = memo(TaskCard);

export default function CompletedScreen() {
  const colorScheme = useActualColorScheme();
  const { t } = useTranslation();
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | undefined>(undefined);

  // Use our custom todos hook
  const { completedTodos, isLoading, refresh } = useTodos();
  
  // Simplified refresh logic using custom hook
  useStableRefresh(refresh);

  // Handle task edit - first restore it, then edit
  const handleEditCompletedTask = (task: Todo) => {
    Alert.alert(
      t('completedTask.editTitle'),
      t('completedTask.editPrompt'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('completedTask.restoreEdit'), 
          onPress: () => {
            const restoredTask = {...task, completed: false};
            setEditingTask(restoredTask);
            setFormVisible(true);
          } 
        }
      ]
    );
  };

  // Memoize the renderItem function to prevent recreating it on each render
  const renderItem = useCallback(({ item }: { item: Todo }) => (
    <MemoizedTaskCard 
      item={item}
      colorScheme={colorScheme as 'light' | 'dark'}
      onEdit={handleEditCompletedTask}
    />
  ), [colorScheme, handleEditCompletedTask]);

  // Memoize the empty component
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <Text style={[styles.loadingText, { color: Colors[colorScheme].text }]}>
          {t('common.loading')}
        </Text>
      ) : (
        <Text style={[styles.emptyText, { color: Colors[colorScheme].lightText }]}>
          {t('task.noCompletedTasks')}
        </Text>
      )}
    </View>
  ), [colorScheme, t, isLoading]);

  return (
    <PageLayout title={t('task.completedTasks')}>
      <FlatList
        data={completedTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => (
          {length: 88, offset: 88 * index, index}
        )}
      />
      
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
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20, // Reduced padding since PageLayout handles spacing
    flexGrow: 1, // Ensures the content can grow to fill the available space
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
});
