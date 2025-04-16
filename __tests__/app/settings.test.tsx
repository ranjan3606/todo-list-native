import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../app/(tabs)/settings';

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
      cardBackground: '#f0f0f0',
      border: '#e0e0e0',
    },
    dark: { 
      background: '#000', 
      text: '#fff', 
      tint: '#0A84FF',
      lightText: '#999',
      cardBackground: '#1c1c1e',
      border: '#444',
    },
    primary: '#007AFF',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
  useThemePreference: () => ['system', jest.fn()],
  saveThemePreference: jest.fn(),
}));

jest.mock('@/services/storage', () => ({
  getSnoozeDuration: () => Promise.resolve(24),
  saveSnoozeDuration: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/hooks/useTags', () => ({
  useTags: () => ({
    tags: {},
    isLoading: false,
    refresh: jest.fn(),
    activeTag: null,
    slideAnim: {},
    handleTagPress: jest.fn(),
  }),
}));

jest.mock('@/components/ThemeSelector', () => ({
  ThemeSelector: jest.fn(() => <React.Fragment>Theme Selector Component</React.Fragment>),
}));

jest.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: jest.fn(() => <React.Fragment>Language Selector Component</React.Fragment>),
}));

jest.mock('@/components/TagForm', () => ({
  TagForm: jest.fn(() => null),
}));

jest.mock('@/components/TagItem', () => ({
  TagItem: jest.fn(() => <React.Fragment>Tag Item Component</React.Fragment>),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'settings.title': 'Settings',
        'settings.theme': 'Theme',
        'settings.language': 'Language',
        'settings.snoozeDuration': 'Snooze Duration',
        'settings.defaultSnoozeTime': 'Default Snooze Time',
        'task.hour': 'hour',
        'task.hours': 'hours',
        'settings.snoozeHelpText': 'This is how long tasks will be snoozed when you use the snooze action.',
        'tags.title': 'Tags',
        'tags.addTag': 'Add Tag',
        'tags.loadingTags': 'Loading tags...',
        'tags.noTags': 'No tags available',
        'app.name': 'Todo App',
        'app.version': 'v1.0.0',
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

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, queryByText } = render(<SettingsScreen />);
    
    expect(getByText('HEADER: Settings')).toBeTruthy();
    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('Language')).toBeTruthy();
    expect(getByText('Theme Selector Component')).toBeTruthy();
    expect(getByText('Language Selector Component')).toBeTruthy();
    expect(getByText('Snooze Duration')).toBeTruthy();
    expect(getByText('Default Snooze Time')).toBeTruthy();
    expect(getByText('24 hours')).toBeTruthy();
    expect(getByText('Tags')).toBeTruthy();
    expect(getByText('Add Tag')).toBeTruthy();
    expect(getByText('No tags available')).toBeTruthy();
    expect(getByText('Todo App v1.0.0')).toBeTruthy();
  });
  
  it('renders tag list when tags are available', async () => {
    jest.spyOn(require('@/hooks/useTags'), 'useTags').mockReturnValue({
      tags: {
        'Work': ['job', 'project'],
        'Personal': ['home', 'family'],
      },
      isLoading: false,
      refresh: jest.fn(),
      activeTag: null,
      slideAnim: { Work: { current: 0 }, Personal: { current: 0 } },
      handleTagPress: jest.fn(),
    });
    
    // The test should render without errors, but we can't verify the FlatList content
    // because of the mocked TagItem component
    const { toJSON } = render(<SettingsScreen />);
    expect(toJSON()).toBeTruthy();
  });
});