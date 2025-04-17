import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SwipeableRow } from '../SwipeableRow';

// Mock @expo/vector-icons to prevent native font loading issues
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    FontAwesome: function MockFontAwesome(props) {
      return React.createElement(
        Text,
        { ...props, testID: `icon-${props.name}` },
        props.name
      );
    }
  };
});

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
// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  const Animated = require('react-native').Animated;
  return {
    Swipeable: ({ renderLeftActions, renderRightActions, children }) => {
      const left = renderLeftActions ? renderLeftActions(new Animated.Value(1)) : null;
      const right = renderRightActions ? renderRightActions(new Animated.Value(1)) : null;
      return (
        <View>
          {left && <View testID="left-actions">{left}</View>}
          <View testID="swipeable-content">{children}</View>
          {right && <View testID="right-actions">{right}</View>}
        </View>
      );
    },
  };
});

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { background: '#fff' },
    dark: { background: '#000' },
    danger: 'red',
    success: 'green',
    info: 'blue',
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: jest.fn().mockReturnValue('light'),
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations = {
        'common.delete': 'Delete',
        'task.done': 'Done',
        'task.undo': 'Undo',
        'task.snooze': 'Snooze'
      };
      return translations[key] || key;
    }
  })
}));

describe('SwipeableRow', () => {
  const mockDelete = jest.fn();
  const mockComplete = jest.fn();
  const mockSnooze = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(
      <SwipeableRow onDelete={mockDelete}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders child content', () => {
    const { getByText } = render(
      <SwipeableRow onDelete={mockDelete}>
        <Text>Test Child Content</Text>
      </SwipeableRow>
    );
    
    expect(getByText('Test Child Content')).toBeTruthy();
  });

  it('renders delete action on the right side', () => {
    const { getByTestId } = render(
      <SwipeableRow onDelete={mockDelete}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    
    // Right actions should be rendered
    const rightActions = getByTestId('right-actions');
    expect(rightActions).toBeTruthy();
  });

  it('renders complete and snooze actions on the left side when provided', () => {
    const { getByTestId } = render(
      <SwipeableRow onDelete={mockDelete} onComplete={mockComplete} onSnooze={mockSnooze}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    
    // Left actions should be rendered
    const leftActions = getByTestId('left-actions');
    expect(leftActions).toBeTruthy();
  });

  it('does not render left actions when onComplete and onSnooze are not provided', () => {
    const { queryByTestId } = render(
      <SwipeableRow onDelete={mockDelete}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    
    // Left actions should not be rendered
    expect(queryByTestId('left-actions')).toBeNull();
  });

  it('uses "Undo" text for complete action when task is already completed', () => {
    const { getByTestId } = render(
      <SwipeableRow onDelete={mockDelete} onComplete={mockComplete} isCompleted={true}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    
    const leftActions = getByTestId('left-actions');
    expect(within(leftActions).getByText('Undo')).toBeTruthy();
  });

  it('uses ref to expose close method', () => {
    const ref = React.createRef();
    
    render(
      <SwipeableRow ref={ref} onDelete={mockDelete}>
        <Text>Content</Text>
      </SwipeableRow>
    );
    
    // The ref should have a close method
    expect(ref.current).toBeTruthy();
    expect(typeof ref.current.close).toBe('function');
  });
});