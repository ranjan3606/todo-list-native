import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import HomeScreen from '../../app/(tabs)/index';

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
    danger: '#ff3b30',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

jest.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    incompleteTodos: [],
    isLoading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/utils/dateUtils', () => ({
  categorizeTasks: () => ({
    today: [],
    tomorrow: [],
    upcoming: [],
    past: [],
  }),
}));

// Create simple mocks first
jest.mock('@/components/TaskCard', () => ({
  TaskCard: jest.fn(),
}));

jest.mock('@/components/TaskForm', () => ({
  TaskForm: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'tabs.home': 'Home',
        'common.loading': 'Loading',
        'task.today': 'Today',
        'task.tomorrow': 'Tomorrow',
        'task.upcoming': 'Upcoming',
        'task.noTasksToday': 'No tasks for today',
        'task.noTasksTomorrow': 'No tasks for tomorrow',
        'task.noUpcomingTasks': 'No upcoming tasks',
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('@/hooks/useStableRefresh', () => ({
  useStableRefresh: jest.fn(),
}));

jest.mock('@/components/PageLayout', () => ({
  PageLayout: jest.fn(),
}));

// Implement the mock behaviors after the mocks are created
const { TaskCard } = require('@/components/TaskCard');
TaskCard.mockImplementation(({ item }) => (
  <React.Fragment>Task: {item.title}</React.Fragment>
));

const { TaskForm } = require('@/components/TaskForm');
TaskForm.mockImplementation(() => null);

const { PageLayout } = require('@/components/PageLayout');
PageLayout.mockImplementation(({ children, title }) => (
  <React.Fragment>
    <Text>{`HEADER: ${title}`}</Text>
    {children}
  </React.Fragment>
));

describe('HomeScreen', () => {
  it('renders correctly with empty task lists', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    
    expect(getByText('HEADER: Home')).toBeTruthy();
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Tomorrow')).toBeTruthy();
    expect(getByText('Upcoming')).toBeTruthy();
    
    // Initially, only "Today" section should be expanded
    expect(getByText('No tasks for today')).toBeTruthy();
    expect(queryByText('No tasks for tomorrow')).toBeNull();
    expect(queryByText('No upcoming tasks')).toBeNull();
  });
  
  it('toggles between sections when headers are clicked', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    
    // Initially, Today section is active
    expect(getByText('No tasks for today')).toBeTruthy();
    
    // Click on Tomorrow section
    fireEvent.press(getByText('Tomorrow'));
    
    // Now Tomorrow section should be active
    expect(queryByText('No tasks for today')).toBeNull();
    expect(getByText('No tasks for tomorrow')).toBeTruthy();
    
    // Click on Upcoming section
    fireEvent.press(getByText('Upcoming'));
    
    // Now Upcoming section should be active
    expect(queryByText('No tasks for tomorrow')).toBeNull();
    expect(getByText('No upcoming tasks')).toBeTruthy();
  });
  
  it('matches snapshot', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});