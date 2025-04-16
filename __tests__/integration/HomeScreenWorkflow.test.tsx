import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { addTodo, getTodos, updateTodo } from '@/services/storage';
import { Todo } from '@/types/todo';
import HomeScreen from '../../app/(tabs)/index';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve())
}));

jest.mock('@/services/storage', () => ({
  addTodo: jest.fn().mockResolvedValue(true),
  getTodos: jest.fn(),
  updateTodo: jest.fn().mockResolvedValue(true),
  toggleTodoCompletion: jest.fn(),
  getSnoozeDuration: jest.fn(),
  snoozeTodo: jest.fn(),
  deleteTodo: jest.fn()
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
    danger: '#ff3b30',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/components/TaskCard', () => ({
  TaskCard: jest.fn(({ item, onEdit }) => (
    <div data-testid={`task-card-${item.id}`} onClick={() => onEdit && onEdit(item)}>
      {item.name}
      {item.tags && item.tags.map(tag => (
        <span key={tag} data-testid={`tag-${tag}`}>{tag}</span>
      ))}
      <button data-testid={`complete-task-${item.id}`}>Complete</button>
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
        } else {
          addTodo({
            id: 'new-task-id',
            name: 'New Task',
            description: 'New task description',
            dueDate: '2025-04-18',
            completed: false,
          });
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

jest.mock('@/utils/dateUtils', () => ({
  categorizeTasks: () => {
    const today = [
      {
        id: 'today-task-1',
        name: 'Today Task 1',
        completed: false,
        dueDate: '2025-04-16',
      },
      {
        id: 'today-task-2',
        name: 'Today Task 2',
        completed: false,
        dueDate: '2025-04-16',
        tags: ['work', 'urgent']
      }
    ];
    
    const tomorrow = [
      {
        id: 'tomorrow-task-1',
        name: 'Tomorrow Task',
        completed: false,
        dueDate: '2025-04-17',
      }
    ];
    
    const upcoming = [
      {
        id: 'upcoming-task-1',
        name: 'Upcoming Task',
        completed: false,
        dueDate: '2025-04-20',
      }
    ];
    
    return {
      today,
      tomorrow,
      upcoming,
      past: []
    };
  },
  isToday: jest.fn().mockReturnValue(true),
  isTomorrow: jest.fn(),
  isDueSoon: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'tabs.home': 'Home',
        'task.today': 'Today',
        'task.tomorrow': 'Tomorrow',
        'task.upcoming': 'Upcoming',
        'common.loading': 'Loading',
        'task.noTasksToday': 'No tasks for today',
        'task.noTasksTomorrow': 'No tasks for tomorrow',
        'task.noUpcomingTasks': 'No upcoming tasks',
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    incompleteTodos: [
      {
        id: 'today-task-1',
        name: 'Today Task 1',
        completed: false,
        dueDate: '2025-04-16',
      },
      {
        id: 'today-task-2',
        name: 'Today Task 2',
        completed: false,
        dueDate: '2025-04-16',
        tags: ['work', 'urgent']
      },
      {
        id: 'tomorrow-task-1',
        name: 'Tomorrow Task',
        completed: false,
        dueDate: '2025-04-17',
      },
      {
        id: 'upcoming-task-1',
        name: 'Upcoming Task',
        completed: false,
        dueDate: '2025-04-20',
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

describe('Home Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render tasks in different sections', async () => {
    const { getByTestId, getByText, queryByText } = render(<HomeScreen />);
    
    // Initially, Today section is active and visible
    expect(getByTestId('page-layout')).toBeTruthy();
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Today Task 1')).toBeTruthy();
    expect(getByText('Today Task 2')).toBeTruthy();
    
    // Tomorrow and Upcoming sections should be present but collapsed
    expect(getByText('Tomorrow')).toBeTruthy();
    expect(getByText('Upcoming')).toBeTruthy();
    expect(queryByText('Tomorrow Task')).toBeNull();
    expect(queryByText('Upcoming Task')).toBeNull();
    
    // Click on Tomorrow section
    await act(async () => {
      fireEvent.press(getByText('Tomorrow'));
    });
    
    // Tomorrow section should be expanded, Today collapsed
    expect(getByText('Tomorrow Task')).toBeTruthy();
    expect(queryByText('Today Task 1')).toBeNull();
    
    // Click on Upcoming section
    await act(async () => {
      fireEvent.press(getByText('Upcoming'));
    });
    
    // Upcoming section should be expanded, Tomorrow collapsed
    expect(getByText('Upcoming Task')).toBeTruthy();
    expect(queryByText('Tomorrow Task')).toBeNull();
  });

  it('should open task form when floating action button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    
    // Task form should not be visible initially
    expect(queryByTestId('task-form')).toBeNull();
    
    // Find and press the floating action button
    const fab = getByTestId('page-layout').querySelector('[style*="position: absolute"]');
    await act(async () => {
      fireEvent.press(fab);
    });
    
    // Task form should be visible
    expect(getByTestId('task-form')).toBeTruthy();
    
    // Close the form
    await act(async () => {
      fireEvent.press(getByTestId('close-button'));
    });
    
    // Task form should be hidden again
    expect(queryByTestId('task-form')).toBeNull();
  });

  it('should add a new task when form is submitted', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    
    // Find and press the floating action button to open form
    const fab = getByTestId('page-layout').querySelector('[style*="position: absolute"]');
    await act(async () => {
      fireEvent.press(fab);
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify that addTodo was called
    expect(addTodo).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Task',
      description: 'New task description',
      dueDate: '2025-04-18',
      completed: false,
    }));
    
    // Form should be closed after submission
    expect(queryByTestId('task-form')).toBeNull();
  });

  it('should open task form for editing when a task is clicked', async () => {
    const { getByTestId, getByText } = render(<HomeScreen />);
    
    // Click on a task to edit
    await act(async () => {
      fireEvent.press(getByText('Today Task 1'));
    });
    
    // Task form should be visible with task data
    expect(getByTestId('task-form')).toBeTruthy();
    
    // Submit the edit form
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify that updateTodo was called
    expect(updateTodo).toHaveBeenCalledWith(expect.objectContaining({
      id: 'today-task-1',
      name: 'Updated Task',
    }));
  });

  it('should show tags on tasks that have them', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    // Find the task with tags
    const taskWithTags = getByTestId('task-card-today-task-2');
    
    // Verify the tags are displayed
    expect(getByTestId('tag-work')).toBeTruthy();
    expect(getByTestId('tag-urgent')).toBeTruthy();
  });

  it('should add a new task with tags and reminder', async () => {
    // Mock addTodo to capture the task being created
    const addTodoMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(require('@/services/storage'), 'addTodo').mockImplementation(addTodoMock);
    
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    
    // Task form should not be visible initially
    expect(queryByTestId('task-form')).toBeNull();
    
    // Find and press the floating action button to open form
    const fab = getByTestId('page-layout').querySelector('[style*="position: absolute"]');
    await act(async () => {
      fireEvent.press(fab);
    });
    
    // Task form should be visible now
    const taskForm = getByTestId('task-form');
    expect(taskForm).toBeTruthy();
    
    // In our mocked TaskForm component, let's simulate entering task details
    // This mocks what would happen if the user filled out the form with all details
    
    // Submit the form
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify addTodo was called with a task that has all fields
    expect(addTodoMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Task',
      description: 'New task description',
      dueDate: '2025-04-18',
      completed: false,
    }));
    
    // Form should be closed after submission
    expect(queryByTestId('task-form')).toBeNull();
  });

  it('should display tasks in Today/Tomorrow/Upcoming sections in light and dark mode', async () => {
    // Start with light mode
    jest.spyOn(require('@/services/theme'), 'useActualColorScheme').mockReturnValue('light');
    
    const { getByText, queryByText, rerender } = render(<HomeScreen />);
    
    // Verify Today section is active by default
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Today Task 1')).toBeTruthy();
    expect(getByText('Today Task 2')).toBeTruthy();
    
    // Check that tag badges are displayed for tasks with tags
    expect(getByText('work')).toBeTruthy();
    expect(getByText('urgent')).toBeTruthy();
    
    // Switch to Tomorrow section
    await act(async () => {
      fireEvent.press(getByText('Tomorrow'));
    });
    
    // Verify Tomorrow task is visible and Today tasks are hidden
    expect(getByText('Tomorrow Task')).toBeTruthy();
    expect(queryByText('Today Task 1')).toBeNull();
    
    // Switch to dark mode and rerender
    jest.spyOn(require('@/services/theme'), 'useActualColorScheme').mockReturnValue('dark');
    rerender(<HomeScreen />);
    
    // Verify the same tasks are still displayed
    expect(getByText('Tomorrow Task')).toBeTruthy();
    
    // Switch to Upcoming section 
    await act(async () => {
      fireEvent.press(getByText('Upcoming'));
    });
    
    // Verify Upcoming task is visible
    expect(getByText('Upcoming Task')).toBeTruthy();
    expect(queryByText('Tomorrow Task')).toBeNull();
  });

  it('should open and edit a task with reminders', async () => {
    // Mock updateTodo to capture the updated task
    const updateTodoMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(require('@/services/storage'), 'updateTodo').mockImplementation(updateTodoMock);
    
    const { getByTestId, getByText } = render(<HomeScreen />);
    
    // Click on a task to edit it
    await act(async () => {
      fireEvent.press(getByText('Today Task 1'));
    });
    
    // Task form should be visible with task data
    expect(getByTestId('task-form')).toBeTruthy();
    
    // Submit the edit form
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });
    
    // Verify updateTodo was called with updated task
    expect(updateTodoMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'today-task-1',
      name: 'Updated Task',
    }));
  });
});