import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';

interface LoadingIndicatorProps {
  color?: string;
  size?: number;
  spacing?: number;
  fullScreen?: boolean;
  backgroundColor?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  size = 8, 
  spacing = 4,
  color,
  fullScreen = false,
  backgroundColor,
}) => {
  const colorScheme = useActualColorScheme();
  const dotColor = color || Colors[colorScheme].tint;
  const overlayColor = backgroundColor || 'rgba(0,0,0,0.3)';
  
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {
          toValue: 1,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ]);
    };

    const animateSequence = () => {
      Animated.loop(
        Animated.parallel([
          animateDot(dot1, 0),
          animateDot(dot2, 150),
          animateDot(dot3, 300),
        ])
      ).start();
    };

    animateSequence();
    
    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  const translateY1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const translateY2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const translateY3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });

  const containerComponent = (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.dot, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: dotColor,
            marginHorizontal: spacing,
            transform: [{ translateY: translateY1 }] 
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.dot, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: dotColor,
            marginHorizontal: spacing,
            transform: [{ translateY: translateY2 }] 
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.dot, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: dotColor,
            marginHorizontal: spacing,
            transform: [{ translateY: translateY3 }] 
          }
        ]} 
      />
    </View>
  );

  // If fullScreen is true, wrap with overlay
  if (fullScreen) {
    return (
      <View style={[styles.fullScreenOverlay, { backgroundColor: overlayColor }]}>
        {containerComponent}
      </View>
    );
  }

  return containerComponent;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  dot: {
    opacity: 0.8,
  },
  fullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  }
});
