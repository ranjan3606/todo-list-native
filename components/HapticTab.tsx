import React from 'react';
import { GestureResponderEvent, Pressable, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export interface HapticTabProps extends BottomTabBarButtonProps {
  onTabPress?: () => void;
}

export function HapticTab(props: HapticTabProps) {
  const { accessibilityState, onPress, children, onTabPress } = props;
  const colorScheme = useColorScheme() ?? 'light';
  const isSelected = accessibilityState?.selected;
  
  const handlePress = (event: GestureResponderEvent) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Call the onTabPress callback if provided
    if (onTabPress) {
      onTabPress();
    }
    
    // Call the original onPress with the event
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      role="button"
      style={({ pressed }) => [
        styles.tab,
        { 
          opacity: pressed ? 0.7 : 1,
          backgroundColor: isSelected ? 
            Colors[colorScheme].tabActiveBackground : 
            'transparent',
        }
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  }
});
