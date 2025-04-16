import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { toggleTodoCompletion, updateTodo } from '@/services/storage';
import CompletedScreen from '../../app/(tabs)/completed';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve())
}));

jest.mock('@/services/storage', () => ({
  toggleTodoCompletion: jest.fn().mockResolvedValue({
    success: true,
    newTodo: {
      id: 'completed-task-1',
      name: 'Completed Task 1',
      completed: false,
    }
  }),
  updateTodo: jest.fn().mockResolvedValue(true),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { 
      background: '#fff', 
      text: '#000', 
      tint: '#007AFF',
      lightText: '#666',
      cardBackground: '#f0f0f0'
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF',
      lightText: '#999',
      cardBackground: '#1c1c1e'
    },
    primary: '#007AFF',
    success: 'green',
    danger: 'red',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/components/TaskCard', () => ({
  TaskCard: jest.fn(({ item, onEdit }) => (
    <div data-testid={`task-card-${item.id}`} onClick={() => onEdit && onEdit(item)}>
      <div data-testid={`task-name-${item.id}`}>{item.name}</div>
      <button data-testid={`uncomplete-task-${item.id}`} onClick={() => toggleTodoCompletion(item.id)}>
        Uncomplete
      </button>
    </div>
  )),
}));

jest.mock('@/components/TaskForm', () => {
  return {
    TaskForm: jest.fn(({ visible, onClose, initialTask }) => {
      if (!visible) return null;
      
      const handleSave = () => {
        if (initialTask) {
          updateTodo({ ...initialTask, name: 'Updated Task' });
        }
        onClose();
      };
      
      return (
        <div data-testid="task-form">
          <input data-testid="task-name-input" defaultValue={initialTask?.name || ''} />
          <button data-testid="save-button" onClick={handleSave}>Save</button>
          <button data-testid="close-button" onClick={onClose}>Close</button>
        </div>
      );
    })
  };
});

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons) {
    const editButton = buttons.find(button => 
      button.text === 'Restore & Edit' || 
      button.text === 'completedTask.restoreEdit'
    );
    
    if (editButton && editButton.onPress) {
      editButton.onPress();
    }
  }
});

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'task.completedTasks': 'Completed Tasks',
        'common.loading': 'Loading',
        'task.noCompletedTasks': 'No completed tasks',
        'completedTask.editTitle': 'Edit Completed Task',
        'completedTask.editPrompt': 'Do you want to restore and edit this task?',
        'common.cancel': 'Cancel',
        'completedTask.restoreEdit': 'Restore & Edit',
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    completedTodos: [
      {
        id: 'completed-task-1',
        name: 'Completed Task 1',
        completed: true,
        dueDate: '2025-04-10',
      },
      {
        id: 'completed-task-2',
        name: 'Completed Task 2',
        completed: true,
        dueDate: '2025-04-12',
        tags: ['work', 'completed']
      }
    ],
    isLoading: false,
    refresh: jest.fn(),
    updateTodo: jest.fn().mockImplementation((id, updates) => {
      return updateTodo({ id, ...updates });
    }),
  }),
}));

jest.mock('@/hooks/useStableRefresh', () => ({
  useStableRefresh: jest.fn(),
}));

jest.mock('@/components/PageLayout', () => ({
  PageLayout: jest.fn(({ children, title }) => (
    <div data-testid="page-layout">
      <div data-testid="header">{title}</div>
      {children}
    </div>
  )),
}));

describe('Completed Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render completed tasks list', () => {
    const { getByTestId, getByText } = render(<CompletedScreen />);
    
    // Verify the page title and layout
    expect(getByTestId('page-layout')).toBeTruthy();
    expect(getByText('Completed Tasks')).toBeTruthy();
    
    // Verify completed tasks are rendered
    expect(getByTestId('task-card-completed-task-1')).toBeTruthy();
    expect(getByTestId('task-card-completed-task-2')).toBeTruthy();
    expect(getByText('Completed Task 1')).toBeTruthy();
    expect(getByText('Completed Task 2')).toBeTruthy();
  });

  it('should show empty state when there are no completed tasks', () => {
    // Override the mock to return empty array
    jest.spyOn(require('@/hooks/useTodos'), 'useTodos').mockReturnValue({
      completedTodos: [],
      isLoading: false,
      refresh: jest.fn(),
    });
    
    const { getByText } = render(<CompletedScreen />);
    
    // Verify empty state is displayed
    expect(getByText('No completed tasks')).toBeTruthy();
  });

  it('should show loading state when tasks are loading', () => {
    // Override the mock to indicate loading
    jest.spyOn(require('@/hooks/useTodos'), 'useTodos').mockReturnValue({
      completedTodos: [],
      isLoading: true,
      refresh: jest.fn(),
    });
    
    const { getByText } = render(<CompletedScreen />);
    
    // Verify loading state is displayed
    expect(getByText('Loading')).toBeTruthy();
  });

  it('should handle restoring and editing a completed task', async () => {
    const { getByTestId } = render(<CompletedScreen />);
    
    // Click on a completed task to edit (this will trigger the Alert dialog)
    await act(async () => {
      fireEvent.press(getByTestId('task-card-completed-task-1'));
    });
    
    // Verify Alert.alert was called with the correct title and message
    expect(Alert.alert).toHaveBeenCalledWith(
      'Edit Completed Task',
      'Do you want to restore and edit this task?',
      expect.anything()
    );
    
    // Since we're mocking Alert to automatically press the "Restore & Edit" button,
    // TaskForm should be visible now
    expect(getByTestId('task-form')).toBeTruthy();
    
    // Submit the form
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify that updateTodo was called with the task restored to uncompleted
    expect(updateTodo).toHaveBeenCalledWith(expect.objectContaining({
      id: 'completed-task-1',
      name: 'Updated Task',
      completed: false,
    }));
  });

  it('should be able to uncomplete a task directly', async () => {
    const { getByTestId } = render(<CompletedScreen />);
    
    // Click on the "Uncomplete" button for a task
    await act(async () => {
      fireEvent.press(getByTestId('uncomplete-task-completed-task-2'));
    });
    
    // Verify that toggleTodoCompletion was called
    expect(toggleTodoCompletion).toHaveBeenCalledWith('completed-task-2');
  });

  it('should be able to handle refreshing the list', async () => {
    const mockRefresh = jest.fn();
    jest.spyOn(require('@/hooks/useTodos'), 'useTodos').mockReturnValue({
      completedTodos: [
        {
          id: 'completed-task-1',
          name: 'Completed Task 1',
          completed: true,
          dueDate: '2025-04-10',
        }
      ],
      isLoading: false,
      refresh: mockRefresh,
    });
    
    render(<CompletedScreen />);
    
    // Verify that refresh was called via useStableRefresh
    expect(require('@/hooks/useStableRefresh').useStableRefresh).toHaveBeenCalledWith(mockRefresh);
  });

  it('should handle task restoration in dark mode', async () => {
    // Set dark mode for this test
    jest.spyOn(require('@/services/theme'), 'useActualColorScheme').mockReturnValue('dark');
    
    // Mock updateTodo to capture the restored task
    const updateTodoMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(require('@/services/storage'), 'updateTodo').mockImplementation(updateTodoMock);
    
    const { getByTestId } = render(<CompletedScreen />);
    
    // Click on a completed task to trigger restoration dialog
    await act(async () => {
      fireEvent.press(getByTestId('task-card-completed-task-1'));
    });
    
    // Verify Alert was shown with correct title and message
    expect(Alert.alert).toHaveBeenCalledWith(
      'Edit Completed Task',
      'Do you want to restore and edit this task?',
      expect.anything()
    );
    
    // Our mock Alert.alert automatically presses "Restore & Edit"
    // So task form should be visible now with dark mode styling
    expect(getByTestId('task-form')).toBeTruthy();
    
    // Submit the form to restore the task
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify updateTodo was called with the restored task (completed = false)
    expect(updateTodoMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'completed-task-1',
      name: 'Updated Task',
      completed: false,
    }));
  });

  it('should display completed tasks with different translations', async () => {
    // Mock translations for different language
    const originalUseTranslation = jest.requireMock('@/i18n').useTranslation;
    jest.spyOn(require('@/i18n'), 'useTranslation').mockImplementation(() => ({
      t: (key: string) => {
        const translations = {
          'task.completedTasks': 'Tareas Completadas', // Spanish
          'common.loading': 'Cargando',
          'task.noCompletedTasks': 'No hay tareas completadas',
          'completedTask.editTitle': 'Editar Tarea Completada',
          'completedTask.editPrompt': '¿Desea restaurar y editar esta tarea?',
          'common.cancel': 'Cancelar',
          'completedTask.restoreEdit': 'Restaurar y Editar',
        };
        return translations[key] || key;
      }
    }));
    
    const { getByText } = render(<CompletedScreen />);
    
    // Verify the Spanish translations are displayed
    expect(getByText('Tareas Completadas')).toBeTruthy();
    
    // Restore original mock implementation
    jest.spyOn(require('@/i18n'), 'useTranslation').mockImplementation(originalUseTranslation);
  });

  it('should handle toggling a task between completed and uncompleted states', async () => {
    // Mock toggleTodoCompletion to simulate toggling
    const toggleMock = jest.fn().mockResolvedValue({
      success: true,
      newTodo: {
        id: 'completed-task-2',
        name: 'Completed Task 2',
        completed: false, // Now uncompleted
        dueDate: '2025-04-12',
        tags: ['work', 'completed']
      }
    });
    jest.spyOn(require('@/services/storage'), 'toggleTodoCompletion').mockImplementation(toggleMock);
    
    const { getByTestId } = render(<CompletedScreen />);
    
    // Click on the "Uncomplete" button for a task
    await act(async () => {
      fireEvent.press(getByTestId('uncomplete-task-completed-task-2'));
    });
    
    // Verify that toggleTodoCompletion was called
    expect(toggleMock).toHaveBeenCalledWith('completed-task-2');
    
    // Verify refresh was called to update the list
    expect(require('@/hooks/useTodos').useTodos().refresh).toHaveBeenCalled();
  });
});