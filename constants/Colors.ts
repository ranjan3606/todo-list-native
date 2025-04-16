/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF2D55',
  background: '#F2F2F7',
  text: '#1C1C1E',
  lightText: '#8E8E93',
  card: '#FFFFFF',
  border: '#C6C6C8',
  notification: '#FF3B30',
  success: '#34C759',
  danger: '#FF3B30',   // Added for due date warning
  warning: '#FFCC00',  // Added for upcoming tasks
  info: '#5AC8FA',     // Added for information
  
  light: {
    text: '#000',
    background: '#fff',
    tint: '#007AFF',
    tabIconDefault: '#ccc',
    tabIconSelected: '#007AFF',
    tabActiveBackground: 'rgba(0, 122, 255, 0.1)', // Light blue background
    cardBackground: '#f9f9f9',
    buttonBackground: '#f8f8f8',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
    dueSoon: '#FF3B30',
    dueTomorrow: '#FFCC00',
    swipeHint: 'rgba(0, 0, 0, 0.1)',
    border: '#C6C6C8', // Added border color for light theme
    lightText: '#8E8E93', // Added lightText property for light theme
  },
  
  dark: {
    text: '#fff',
    background: '#121212', // Darker for OLED screens
    tint: '#0A84FF', // Brighter blue for dark mode
    tabIconDefault: '#888',
    tabIconSelected: '#0A84FF',
    tabActiveBackground: 'rgba(10, 132, 255, 0.3)', // Darker blue background
    cardBackground: '#1E1E1E',
    buttonBackground: '#2C2C2E',
    modalBackground: 'rgba(0, 0, 0, 0.7)',
    dueSoon: '#FF453A', // Brighter red for dark mode
    dueTomorrow: '#FFD60A', // Brighter yellow for dark mode
    swipeHint: 'rgba(255, 255, 255, 0.1)',
    border: '#38383A', // Added darker border color for dark theme
    lightText: '#AEAEB2', // Added lightText property with brighter shade for dark theme
  }
};
