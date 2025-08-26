import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../utils/themes';
import { NotificationData } from '../../services/hybridNotificationService';
import { Ionicons } from '@expo/vector-icons';

interface InAppNotificationProps {
  notification: NotificationData;
  onDismiss: () => void;
  onPress?: () => void;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const theme = useTheme();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in from top
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getIconName = (type?: string) => {
    switch (type) {
      case 'message':
        return 'chatbubble-ellipses';
      case 'match':
        return 'heart';
      case 'typing':
        return 'ellipsis-horizontal';
      case 'online':
        return 'wifi';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'message':
        return theme.colors.primary;
      case 'match':
        return '#FF6B9D';
      case 'typing':
        return theme.colors.secondary;
      case 'online':
        return '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#FF5722';
      case 'low':
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderLeftColor: getPriorityColor(notification.priority),
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          shadowColor: theme.colors.text,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: Platform.OS === 'android' ? 8 : 0,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIconName(notification.type) as any}
            size={24}
            color={getIconColor(notification.type)}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text
            style={[
              styles.body,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissNotification}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
