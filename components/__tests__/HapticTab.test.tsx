import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HapticTab, HapticTabProps } from '../HapticTab';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

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

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }
}));

describe('HapticTab', () => {
  const defaultProps: HapticTabProps = {
    accessibilityState: { selected: false },
    onPress: jest.fn(),
    children: <></>,
  };
  
  // Store original Platform.OS
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original Platform.OS after each test
    Platform.OS = originalOS;
  });

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(<HapticTab {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies selected style when selected', () => {
    const { getByRole } = render(
      <HapticTab {...defaultProps} accessibilityState={{ selected: true }} />
    );
    const pressable = getByRole('button');
    expect(pressable.props.style[1].backgroundColor).not.toBe('transparent');
  });

  it('calls onTabPress and onPress when pressed', () => {
    const onTabPress = jest.fn();
    const onPress = jest.fn();
    const { getByRole } = render(
      <HapticTab {...defaultProps} onTabPress={onTabPress} onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onTabPress).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
  });

  it('triggers haptic feedback on iOS', () => {
    // Directly set Platform.OS instead of using spyOn
    Platform.OS = 'ios';
    const { getByRole } = render(<HapticTab {...defaultProps} />);
    fireEvent.press(getByRole('button'));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does not trigger haptic feedback on Android', () => {
    // Directly set Platform.OS instead of using spyOn
    Platform.OS = 'android';
    const { getByRole } = render(<HapticTab {...defaultProps} />);
    fireEvent.press(getByRole('button'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
