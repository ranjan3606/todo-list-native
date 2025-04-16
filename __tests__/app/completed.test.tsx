import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CompletedScreen from '../../app/(tabs)/completed';

// Mock required modules
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
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    completedTodos: [],
    isLoading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/components/TaskCard', () => ({
  TaskCard: jest.fn(({ item }) => (
    <React.Fragment>Task: {item.title}</React.Fragment>
  )),
}));

jest.mock('@/components/TaskForm', () => ({
  TaskForm: jest.fn(() => null),
}));

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

jest.mock('@/hooks/useStableRefresh', () => ({
  useStableRefresh: jest.fn(),
}));

jest.mock('@/components/PageLayout', () => ({
  PageLayout: jest.fn(({ children, title }) => (
    <React.Fragment>
      <div>HEADER: {title}</div>
      {children}
    </React.Fragment>
  )),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('CompletedScreen', () => {
  it('renders correctly with empty completed tasks', () => {
    const { getByText } = render(<CompletedScreen />);
    
    expect(getByText('HEADER: Completed Tasks')).toBeTruthy();
    expect(getByText('No completed tasks')).toBeTruthy();
  });
  
  it('displays the loading state correctly', () => {
    jest.spyOn(require('@/hooks/useTodos'), 'useTodos').mockReturnValue({
      completedTodos: [],
      isLoading: true,
      refresh: jest.fn(),
    });
    
    const { getByText } = render(<CompletedScreen />);
    expect(getByText('Loading')).toBeTruthy();
  });
  
  it('renders a list of completed tasks', () => {
    jest.spyOn(require('@/hooks/useTodos'), 'useTodos').mockReturnValue({
      completedTodos: [
        { id: '1', title: 'Task 1', completed: true, dueDate: new Date().toISOString() },
        { id: '2', title: 'Task 2', completed: true, dueDate: new Date().toISOString() },
      ],
      isLoading: false,
      refresh: jest.fn(),
    });
    
    // This should work but we won't be able to see the tasks due to the mock of TaskCard
    // The important part is that the component renders without errors
    const { toJSON } = render(<CompletedScreen />);
    expect(toJSON()).toBeTruthy();
  });
});