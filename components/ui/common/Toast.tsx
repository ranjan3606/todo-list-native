import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  useColorScheme,
  Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { todoEvents } from '@/services/eventEmitter';
import { SHOW_TOAST_EVENT, ToastMessage, ToastType } from '@/utils/toastUtils';

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'exclamation-circle';
    case 'info':
      return 'info-circle';
    default:
      return 'bell';
  }
};

export const Toast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const [pending, setPending] = useState<ToastMessage[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Theme colors
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#2c2c2e' }, 'border');

  const getToastColor = (type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  const showToast = (toast: ToastMessage) => {
    if (visible) {
      // Queue this toast if one is already showing
      setPending(prev => [...prev, toast]);
      return;
    }

    setCurrentToast(toast);
    setVisible(true);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Set timeout to hide toast
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, toast.duration || 3000);
  };

  const hideToast = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setCurrentToast(null);
      
      // Show next toast if any
      if (pending.length > 0) {
        const nextToast = pending[0];
        setPending(prev => prev.slice(1));
        setTimeout(() => {
          showToast(nextToast);
        }, 100);
      }
    });
  };

  // Set up event listener for toast events
  useEffect(() => {
    const unsubscribe = todoEvents.on(SHOW_TOAST_EVENT, showToast);
    
    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!visible || !currentToast) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View 
        style={[
          styles.toastContent,
          { borderLeftColor: getToastColor(currentToast.type) }
        ]}
      >
        <FontAwesome 
          name={getToastIcon(currentToast.type || 'info')} 
          size={18} 
          color={getToastColor(currentToast.type)} 
          style={styles.icon}
        />
        <Text style={[styles.message, { color: textColor }]}>
          {currentToast.message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <FontAwesome name="times" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 1000,
    maxWidth: width - 40,
    alignSelf: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
});