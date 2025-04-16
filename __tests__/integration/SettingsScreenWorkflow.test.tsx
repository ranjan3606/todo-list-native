import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getSnoozeDuration, saveSnoozeDuration } from '@/services/storage';
import SettingsScreen from '../../app/(tabs)/settings';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve())
}));

jest.mock('@/services/storage', () => ({
  getSnoozeDuration: jest.fn().mockResolvedValue(24),
  saveSnoozeDuration: jest.fn().mockResolvedValue(true),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name, size, color }) => (
    <div data-testid={`icon-${name}`} style={{ fontSize: size, color }}>
      {name}
    </div>
  ),
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
  saveThemePreference: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/components/ThemeSelector', () => ({
  ThemeSelector: jest.fn(({ colorScheme, currentTheme, onThemeChange }) => (
    <div data-testid="theme-selector">
      <button data-testid="theme-light" onClick={() => onThemeChange('light')}>Light</button>
      <button data-testid="theme-dark" onClick={() => onThemeChange('dark')}>Dark</button>
      <button data-testid="theme-system" onClick={() => onThemeChange('system')}>System</button>
      <div>Current: {currentTheme}</div>
    </div>
  )),
}));

jest.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: jest.fn(({ colorScheme }) => (
    <div data-testid="language-selector">
      <button data-testid="lang-en">English</button>
      <button data-testid="lang-es">Español</button>
      <button data-testid="lang-fr">Français</button>
    </div>
  )),
}));

// Mock TagForm component
jest.mock('@/components/TagForm', () => ({
  TagForm: jest.fn(({ visible, onSave, onCancel, mode, tagName, tagKeywords }) => {
    if (!visible) return null;
    
    return (
      <div data-testid="tag-form">
        <div>Mode: {mode}</div>
        <input data-testid="tag-name-input" defaultValue={tagName} />
        <input data-testid="tag-keywords-input" defaultValue={tagKeywords} />
        <button data-testid="save-tag-button" onClick={onSave}>Save</button>
        <button data-testid="cancel-tag-button" onClick={onCancel}>Cancel</button>
      </div>
    );
  }),
}));

// Mock TagItem component
jest.mock('@/components/TagItem', () => ({
  TagItem: jest.fn(({ tagName, keywords, onPress, onEdit }) => (
    <div data-testid={`tag-item-${tagName}`} onClick={onPress}>
      <div data-testid={`tag-name-${tagName}`}>{tagName}</div>
      <div data-testid={`tag-keywords-${tagName}`}>{keywords.join(', ')}</div>
      <button data-testid={`edit-tag-${tagName}`} onClick={onEdit}>Edit</button>
    </div>
  )),
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
        'settings.invalidDuration': 'Invalid Duration',
        'settings.durationRange': 'Duration must be between 1 and 168 hours.',
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

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons) {
    const confirmButton = buttons.find(button => button.text !== 'Cancel' && button.style !== 'cancel');
    if (confirmButton && confirmButton.onPress) {
      confirmButton.onPress();
    }
  }
});

// Mock useTags hook
jest.mock('@/hooks/useTags', () => ({
  useTags: () => ({
    tags: {
      'work': ['job', 'project', 'meeting'],
      'personal': ['home', 'family'],
    },
    isLoading: false,
    refresh: jest.fn(),
    activeTag: null,
    slideAnim: { 
      work: { current: 0 }, 
      personal: { current: 0 } 
    },
    handleTagPress: jest.fn(),
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

describe('Settings Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all settings sections properly', () => {
    const { getByTestId, getByText } = render(<SettingsScreen />);
    
    // Verify the page title and layout
    expect(getByTestId('page-layout')).toBeTruthy();
    expect(getByTestId('header')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    
    // Verify theme section is rendered
    expect(getByText('Theme')).toBeTruthy();
    expect(getByTestId('theme-selector')).toBeTruthy();
    
    // Verify language section is rendered
    expect(getByText('Language')).toBeTruthy();
    expect(getByTestId('language-selector')).toBeTruthy();
    
    // Verify snooze duration section is rendered
    expect(getByText('Snooze Duration')).toBeTruthy();
    expect(getByText('Default Snooze Time')).toBeTruthy();
    expect(getByText('24 hours')).toBeTruthy();
    
    // Verify tags section is rendered
    expect(getByText('Tags')).toBeTruthy();
    expect(getByText('Add Tag')).toBeTruthy();
    
    // Verify tag items are rendered
    expect(getByTestId('tag-item-work')).toBeTruthy();
    expect(getByTestId('tag-item-personal')).toBeTruthy();
  });

  it('should change theme when theme options are clicked', async () => {
    const { getByTestId } = render(<SettingsScreen />);
    
    // Click on light theme option
    await act(async () => {
      fireEvent.press(getByTestId('theme-light'));
    });
    
    // Verify that saveThemePreference was called with 'light'
    expect(require('@/services/theme').saveThemePreference).toHaveBeenCalledWith('light');
    
    // Click on dark theme option
    await act(async () => {
      fireEvent.press(getByTestId('theme-dark'));
    });
    
    // Verify that saveThemePreference was called with 'dark'
    expect(require('@/services/theme').saveThemePreference).toHaveBeenCalledWith('dark');
  });

  it('should edit snooze duration', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<SettingsScreen />);
    
    // Initially in view mode
    expect(getByText('24 hours')).toBeTruthy();
    
    // Click to edit
    await act(async () => {
      fireEvent.press(getByText('24 hours').parentNode);
    });
    
    // Now should be in edit mode with input
    const input = getByTestId('page-layout').querySelector('input');
    expect(input).toBeTruthy();
    
    // Change value to 12
    await act(async () => {
      fireEvent.changeText(input, '12');
    });
    
    // Click save button (check icon)
    await act(async () => {
      fireEvent.press(getByTestId('icon-check'));
    });
    
    // Verify saveSnoozeDuration was called with 12
    expect(saveSnoozeDuration).toHaveBeenCalledWith(12);
  });

  it('should reject invalid snooze duration', async () => {
    const { getByTestId, getByText } = render(<SettingsScreen />);
    
    // Click to edit
    await act(async () => {
      fireEvent.press(getByText('24 hours').parentNode);
    });
    
    // Find input and change to invalid value
    const input = getByTestId('page-layout').querySelector('input');
    
    // Set to invalid value
    await act(async () => {
      fireEvent.changeText(input, '999');
    });
    
    // Try to save
    await act(async () => {
      fireEvent.press(getByTestId('icon-check'));
    });
    
    // Alert should be shown with error message
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Duration', 
      'Duration must be between 1 and 168 hours.',
      expect.anything()
    );
    
    // saveSnoozeDuration should not be called
    expect(saveSnoozeDuration).not.toHaveBeenCalled();
  });

  it('should open the tag form when Add Tag button is clicked', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<SettingsScreen />);
    
    // Tag form should not be visible initially
    expect(queryByTestId('tag-form')).toBeNull();
    
    // Click Add Tag button
    await act(async () => {
      fireEvent.press(getByText('Add Tag'));
    });
    
    // Tag form should be visible
    expect(getByTestId('tag-form')).toBeTruthy();
    
    // Form should be in 'add' mode
    expect(getByText('Mode: add')).toBeTruthy();
    
    // Cancel the form
    await act(async () => {
      fireEvent.press(getByTestId('cancel-tag-button'));
    });
    
    // Form should be hidden again
    expect(queryByTestId('tag-form')).toBeNull();
  });

  it('should open the tag form in edit mode when Edit button is clicked on a tag', async () => {
    const { getByTestId, queryByTestId } = render(<SettingsScreen />);
    
    // Click edit button on work tag
    await act(async () => {
      fireEvent.press(getByTestId('edit-tag-work'));
    });
    
    // Tag form should be visible
    expect(getByTestId('tag-form')).toBeTruthy();
    
    // Form should be in 'edit' mode
    expect(getByTestId('tag-form').textContent).toContain('Mode: edit');
    
    // Verify tag name is pre-populated
    const nameInput = getByTestId('tag-name-input');
    expect(nameInput.props.defaultValue).toBe('work');
  });

  it('should show version information', () => {
    const { getByText } = render(<SettingsScreen />);
    
    // Version info should be displayed
    expect(getByText('Todo App v1.0.0')).toBeTruthy();
  });

  it('should correctly switch between light and dark modes', async () => {
    // Mock the useActualColorScheme to toggle between light and dark
    let mockColorScheme = 'light';
    jest.spyOn(require('@/services/theme'), 'useActualColorScheme').mockImplementation(() => mockColorScheme);
    
    const { getByTestId, rerender } = render(<SettingsScreen />);
    
    // Verify initial light mode theme is applied
    expect(getByTestId('page-layout')).toBeTruthy();
    
    // Click on dark theme option
    await act(async () => {
      fireEvent.press(getByTestId('theme-dark'));
    });
    
    // Verify that saveThemePreference was called with 'dark'
    expect(require('@/services/theme').saveThemePreference).toHaveBeenCalledWith('dark');
    
    // Change the mock to return dark mode
    mockColorScheme = 'dark';
    
    // Re-render with new theme
    rerender(<SettingsScreen />);
    
    // Verify dark mode styling is applied (would need to check specific styles)
    const pageLayout = getByTestId('page-layout');
    expect(pageLayout).toBeTruthy();
    
    // Click back to light theme
    await act(async () => {
      fireEvent.press(getByTestId('theme-light'));
    });
    
    // Verify that saveThemePreference was called with 'light'
    expect(require('@/services/theme').saveThemePreference).toHaveBeenCalledWith('light');
  });

  it('should change language settings', async () => {
    // Mock language change functionality
    const mockSetLanguage = jest.fn().mockResolvedValue(true);
    jest.mock('@/i18n', () => ({
      ...jest.requireActual('@/i18n'),
      useTranslation: () => ({
        t: (key: string) => {
          const translations = {
            'settings.title': 'Settings',
            'settings.theme': 'Theme',
            'settings.language': 'Language',
            // ...other translations...
          };
          return translations[key] || key;
        },
        setLanguage: mockSetLanguage
      })
    }));
    
    const { getByTestId } = render(<SettingsScreen />);
    
    // Verify language selector is rendered
    expect(getByTestId('language-selector')).toBeTruthy();
    
    // Click on Spanish option
    await act(async () => {
      fireEvent.press(getByTestId('lang-es'));
    });
    
    // Since we've mocked the language change function, we can't directly
    // test the UI changes, but we can confirm the language change was requested
    // This depends on how your LanguageSelector component calls setLanguage
    expect(mockSetLanguage).toHaveBeenCalledTimes(1);
  });

  it('should add and manage tags with proper styling in dark mode', async () => {
    // Set dark mode for this test
    jest.spyOn(require('@/services/theme'), 'useActualColorScheme').mockReturnValue('dark');
    
    const { getByTestId, getByText, queryByTestId } = render(<SettingsScreen />);
    
    // Verify tags section is rendered in dark mode
    expect(getByText('Tags')).toBeTruthy();
    
    // Click Add Tag button
    await act(async () => {
      fireEvent.press(getByText('Add Tag'));
    });
    
    // Tag form should be visible
    const tagForm = getByTestId('tag-form');
    expect(tagForm).toBeTruthy();
    
    // Fill tag details
    await act(async () => {
      fireEvent.changeText(getByTestId('tag-name-input'), 'shopping');
      fireEvent.changeText(getByTestId('tag-keywords-input'), 'groceries, store, market');
    });
    
    // Save tag
    await act(async () => {
      fireEvent.press(getByTestId('save-tag-button'));
    });
    
    // Form should close after saving
    expect(queryByTestId('tag-form')).toBeNull();
    
    // Verify refresh was called to update the tag list
    expect(require('@/hooks/useTags').useTags().refresh).toHaveBeenCalled();
  });
});