import React, { useState, useEffect } from 'react';
import { Tabs, useNavigation, usePathname } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { HapticTab, HapticTabProps } from '@/components/HapticTab';
import { Platform, StatusBar, View } from 'react-native';
import { useActualColorScheme } from '@/services/theme';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function TabLayout() {
  const colorScheme = useActualColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const currentPath = usePathname();

  // Track tab changes to show loading indicator
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      setIsLoading(true);
      
      // Hide loading indicator after content loads
      // You can adjust the timeout as needed
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timeout);
    });
    
    return unsubscribe;
  }, [navigation]);

  // Initial load - turn off loading
  useEffect(() => {
    setIsLoading(false);
  }, [currentPath]);

  // Simple wrapper for HapticTab
  const TabButton = (props: HapticTabProps) => (
    <HapticTab {...props} />
  );

  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={Colors[colorScheme].background}
      />
      
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}>
          <LoadingIndicator fullScreen={true} />
        </View>
      )}
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint || Colors.primary,
          headerShown: false,
          tabBarButton: TabButton,
          tabBarStyle: { 
            backgroundColor: Colors[colorScheme].background,
            borderTopWidth: 0,
            elevation: 0,
            height: Platform.OS === 'android' ? 60 : undefined,
            paddingBottom: Platform.OS === 'android' ? 8 : undefined,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="completed"
          options={{
            title: 'Completed',
            tabBarIcon: ({ color }) => <FontAwesome name="check" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <FontAwesome name="cog" size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
