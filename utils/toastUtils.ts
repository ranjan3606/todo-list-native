import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { todoEvents } from '@/services/eventEmitter';

// Event name for our toast
const SHOW_TOAST_EVENT = 'SHOW_TOAST';

// Toast types
export type ToastType = 'success' | 'error' | 'info';

// Toast message structure
export interface ToastMessage {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Shows a toast notification
 * @param message Message to display or a toast object with additional configuration
 * @param type Optional toast type (success, error, info)
 * @param duration Optional duration in milliseconds
 */
export const showToast = (
  message: string | ToastMessage,
  type: ToastType = 'success',
  duration: number = 3000
) => {
  // Trigger haptic feedback
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(
      type === 'error' 
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Success
    );
  }

  // Format the message object
  const toastMessage: ToastMessage = typeof message === 'string'
    ? { message, type, duration }
    : { ...message };

  // Emit the event with the toast data
  todoEvents.emit(SHOW_TOAST_EVENT, toastMessage);
};

// Export the event name for listeners
export { SHOW_TOAST_EVENT };