import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { HapticTab, HapticTabProps } from '@/components/HapticTab';
import { Platform, StatusBar } from 'react-native';
import { useActualColorScheme } from '@/services/theme';

export default function TabLayout() {
  const colorScheme = useActualColorScheme();

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
