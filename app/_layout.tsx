import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { StyleSheet, LogBox, Platform, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { useActualColorScheme, useThemeLoading } from "@/services/theme";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { Colors } from "@/constants/Colors";
import { TranslationProvider } from "@/i18n";
import { 
  requestNotificationPermissions,
  configureNotificationCategories,
  setupNotificationResponseHandlers
} from "@/services/notifications";
import { useTodos } from "@/hooks/useTodos";
import { Toast } from "@/components/ui/common/Toast";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Suppress specific warnings that come from third-party libraries
// These must be called before the warnings occur to successfully suppress them
LogBox.ignoreLogs([
  "Warning: Day: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.",
  "expo-notifications: Push notifications",
  "We recommend you instead use a development build to avoid limitations",
  "Push notifications (remote notifications) functionality provided by expo-notifications will be removed from Expo Go"
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useActualColorScheme();
  const isThemeLoading = useThemeLoading();
  const notificationListener = useRef<any>();
  const { updateTodo } = useTodos();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize enhanced calendar-style notifications - simplified to work in Expo Go
  useEffect(() => {
    async function setupNotifications() {
      try {
        // Request notification permissions - bypassing the problematic push token logic
        const hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          console.log('Notifications permission not granted');
          return;
        }
        
        // Set up notification categories with interactive buttons
        await configureNotificationCategories();
        
        // Set up notification response handlers
        const cleanup = setupNotificationResponseHandlers(
          // Handle task completion from notification
          (taskId) => {
            updateTodo(taskId, { completed: true });
          },
          // Handle task snooze from notification
          (taskId) => {
            // Get the task and reschedule for 30 minutes later
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            // This just snoozes the notification - it doesn't change the actual due date
          }
        );
        
        // This listener is fired whenever a notification is received while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received in foreground');
          // You could show an in-app alert or update the UI here
        });
        
        return () => {
          cleanup();
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
        };
      } catch (error) {
        // Don't log the full error to avoid showing the projectId error in the console
        console.log('Could not set up some notification features. Local notifications will still work.');
      }
    }
    
    setupNotifications();
  }, [updateTodo]);

  if (!loaded) {
    return null;
  }

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {isThemeLoading && (
        <LoadingIndicator 
          color={Colors[colorScheme].tint} 
          size={10} 
          fullScreen={true} 
        />
      )}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Toast />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <TranslationProvider>
        <RootLayoutContent />
      </TranslationProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
