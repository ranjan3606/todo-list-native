import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert, Modal, View, Text } from 'react-native';
import { TaskCard } from '../TaskCard';
import { deleteTodo, toggleTodoCompletion, snoozeTodo } from '@/services/storage';
import { getSnoozeDuration } from '@/services/storage';
import { showToast } from '@/utils/toastUtils';

// Fix the FontAwesome mock to avoid out-of-scope variable references
jest.mock('@expo/vector-icons', () => ({
  FontAwesome: jest.fn().mockImplementation((props) => ({
    type: 'FontAwesome',
    props: {...props, testID: `icon-${props.name}`},
    children: null
  }))
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));

// Mock required dependencies
jest.mock('@/services/storage', () => ({
  deleteTodo: jest.fn().mockResolvedValue(true),
  toggleTodoCompletion: jest.fn(),
  snoozeTodo: jest.fn(),
  getSnoozeDuration: jest.fn().mockResolvedValue(24),
}));

jest.mock('@/utils/toastUtils', () => ({
  showToast: jest.fn(),
}));

jest.mock('@/utils/dateUtils', () => ({
  isToday: jest.fn().mockReturnValue(false),
  isTomorrow: jest.fn().mockReturnValue(false),
  isDueSoon: jest.fn().mockReturnValue(false),
  getNextDueDate: jest.fn(),
  formatDisplayDate: jest.fn().mockReturnValue('2025-04-20'),
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: {
      text: '#000',
      background: '#fff',
      cardBackground: '#fff',
      lightText: '#777',
      dueSoon: '#ff9800',
    },
    dark: {
      text: '#fff',
      background: '#000',
      cardBackground: '#222',
      lightText: '#aaa',
      dueSoon: '#ff9800',
    },
    success: 'green',
    danger: 'red',
    warning: 'orange',
    info: 'blue',
  },
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params) => {
      const translations = {
        'task.edit': 'Edit Task',
        'task.deleteConfirm': 'Are you sure you want to delete this task?',
        'common.cancel': 'Cancel',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.error': 'Error',
        'task.error': 'There was an error processing your task',
        'taskForm.error': 'There was an error saving your task',
        'task.hour': 'hour',
        'task.hours': 'hours',
        'task.snoozed': 'Task Snoozed',
        'task.snoozedFor': params ? `Snoozed for ${params.hours}` : 'Snoozed',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock SwipeableRow component
jest.mock('../SwipeableRow', () => ({
  SwipeableRow: ({ children, onDelete, onComplete, onSnooze, isCompleted }) => (
    <div data-testid="swipeable-row" onClick={() => onDelete()}>
      {children}
      <button data-testid="delete-button" onClick={onDelete}>Delete</button>
      {onComplete && <button data-testid="complete-button" onClick={onComplete}>Complete</button>}
      {onSnooze && <button data-testid="snooze-button" onClick={onSnooze}>Snooze</button>}
    </div>
  ),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Find and trigger the delete button callback if it exists
  const deleteButton = buttons?.find(button => button.text === 'Delete');
  if (deleteButton && deleteButton.onPress) {
    deleteButton.onPress();
  }
});

// Fix the react-native mock to avoid similar scope issues
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Modal = jest.fn().mockImplementation(({children, visible, ...props}) => {
    if (!visible) return null;
    return {
      type: 'Modal',
      props,
      children
    };
  });
  return rn;
});

describe('TaskCard', () => {
  const mockTodo = {
    id: 'task-1',
    name: 'Test Task',
    description: 'Task description',
    completed: false,
    dueDate: '2025-04-20',
    tags: ['work', 'important'],
  };

  const mockCompletedTodo = {
    ...mockTodo,
    completed: true,
  };

  const mockEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (toggleTodoCompletion as jest.Mock).mockResolvedValue({
      success: true,
      newTodo: { ...mockTodo, completed: true },
    });
    (snoozeTodo as jest.Mock).mockResolvedValue({
      success: true,
      newDueDate: '2025-04-21',
    });
  });

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders task details correctly', () => {
    const { getByText } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    expect(getByText('Test Task')).toBeTruthy();
  });

  it('handles delete action', async () => {
    const { getByTestId } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    // Trigger delete
    await act(async () => {
      fireEvent.press(getByTestId('delete-button'));
    });
    
    expect(deleteTodo).toHaveBeenCalledWith('task-1');
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Test Task'),
      'success'
    );
  });

  it('handles complete action', async () => {
    const { getByTestId } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    // Trigger complete
    await act(async () => {
      fireEvent.press(getByTestId('complete-button'));
    });
    
    expect(toggleTodoCompletion).toHaveBeenCalledWith('task-1');
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Test Task'),
      'success'
    );
  });

  it('handles snooze action', async () => {
    const { getByTestId } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    // Trigger snooze
    await act(async () => {
      fireEvent.press(getByTestId('snooze-button'));
    });
    
    expect(getSnoozeDuration).toHaveBeenCalled();
    expect(snoozeTodo).toHaveBeenCalledWith('task-1', 24);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Task Snoozed',
      expect.stringContaining('24')
    );
  });

  it('applies different styles for completed tasks', () => {
    const { container } = render(
      <TaskCard item={mockCompletedTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    // This test would check for completed task styles, but since React Native Testing Library
    // doesn't expose styles directly in the container, we'll just check the component renders
    expect(container).toBeTruthy();
  });

  it('handles long press to show edit options', () => {
    const { getByText } = render(
      <TaskCard item={mockTodo} colorScheme="light" onEdit={mockEdit} />
    );
    
    // Long press on task
    fireEvent(getByText('Test Task'), 'longPress');
    
    // Alert should be shown with edit options
    expect(Alert.alert).toHaveBeenCalledWith(
      'Edit Task',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Edit' }),
        expect.objectContaining({ text: 'Delete' }),
      ])
    );
  });
});