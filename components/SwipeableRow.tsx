import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';
import { useTranslation } from '@/i18n';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onComplete?: () => void;
  onSnooze?: () => void;
  isCompleted?: boolean;
}

// Define a ref interface for exposing methods
export interface SwipeableRowHandle {
  close: () => void;
}

// Use forwardRef to properly handle refs
export const SwipeableRow = forwardRef<SwipeableRowHandle, SwipeableRowProps>(({ 
  children, 
  onDelete, 
  onComplete,
  onSnooze,
  isCompleted = false
}, ref) => {
  const swipeableRef = useRef<Swipeable>(null);
  const colorScheme = useActualColorScheme();
  const { t } = useTranslation();
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    close: () => {
      swipeableRef.current?.close();
    }
  }));

  const renderRightAction = (
    text: string,
    color: string,
    icon: string, 
    x: number,
    progress: Animated.AnimatedInterpolation<number>,
    action: () => void
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    
    const pressHandler = () => {
      swipeableRef.current?.close();
      action();
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <Pressable
          style={({ pressed }) => [
            styles.rightAction, 
            { backgroundColor: color },
            pressed && { opacity: 0.7 }
          ]}
          onPress={pressHandler}>
          <FontAwesome name={icon} size={20} color="white" style={styles.actionIcon} />
          <Text style={styles.actionText}>{text}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => (
    <View style={{ width: 80, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
      {renderRightAction(t('common.delete'), Colors.danger, 'trash', 80, progress, onDelete)}
    </View>
  );

  const renderLeftAction = (
    text: string,
    color: string,
    icon: string,
    x: number,
    progress: Animated.AnimatedInterpolation<number>,
    action: () => void
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    
    const pressHandler = () => {
      swipeableRef.current?.close();
      action();
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <Pressable
          style={({ pressed }) => [
            styles.leftAction, 
            { backgroundColor: color },
            pressed && { opacity: 0.7 }
          ]}
          onPress={pressHandler}>
          <FontAwesome name={icon} size={20} color="white" style={styles.actionIcon} />
          <Text style={styles.actionText}>{text}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
    if (!onComplete && !onSnooze) return null;
    
    const actionWidth = 100;
    const actions = [];
    
    if (onSnooze) {
      actions.push(
        renderLeftAction(
          t('task.snooze'), 
          Colors.info, 
          'clock-o', 
          -actionWidth, 
          progress, 
          onSnooze
        )
      );
    }
    
    if (onComplete) {
      actions.push(
        renderLeftAction(
          isCompleted ? t('task.undo') : t('task.done'), 
          Colors.success, 
          isCompleted ? 'undo' : 'check', 
          onSnooze ? -2 * actionWidth : -actionWidth, 
          progress, 
          onComplete
        )
      );
    }
    
    return (
      <View style={{ width: actions.length * actionWidth, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
        {actions.map((action, index) => (
          <React.Fragment key={`action-${index}`}>
            {action}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={30}
        rightThreshold={40}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}>
        {children}
      </Swipeable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
