import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { config } from '../../../lib/config';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../utils/themes';

export const VapidTest: React.FC = () => {
  const theme = useTheme();
  const { isSupported, isEnabled, isInitialized, sendNotification } = useNotifications();
  const [testStatus, setTestStatus] = useState<string>('');

  const testVapidKeys = () => {
    const publicKey = config.api.vapidPublicKey;
    const privateKey = config.api.vapidPrivateKey;
    
    setTestStatus(`Public Key: ${publicKey}\nPrivate Key: ${privateKey}`);
    
          if (publicKey && publicKey.length > 20) {
        Alert.alert('VAPID Keys Configured', 'VAPID keys are properly set up!');
      } else {
        Alert.alert('VAPID Keys Missing', 'Please configure your VAPID keys.');
      }
  };

  const testWebPush = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Web Push testing is only available on web platform');
      return;
    }

    try {
      const success = await sendNotification({
        title: 'VAPID Test',
        body: 'This is a test notification to verify VAPID keys are working!',
        type: 'general',
        priority: 'high',
        data: { test: true, timestamp: Date.now() }
      });

      if (success) {
        setTestStatus('Test notification sent successfully!');
        Alert.alert('Success', 'Test notification sent! Check your browser notifications.');
      } else {
        setTestStatus('Failed to send test notification');
        Alert.alert('Error', 'Failed to send test notification. Check console for details.');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      setTestStatus('Error sending test notification');
      Alert.alert('Error', `Failed to send test notification: ${error}`);
    }
  };

  const testServiceWorker = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Service Worker testing is only available on web platform');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          setTestStatus('Service Worker registered');
          Alert.alert('Service Worker', `Found ${registrations.length} service worker(s)`);
        } else {
          setTestStatus('No Service Worker found');
          Alert.alert('Service Worker', 'No service workers registered');
        }
      });
    } else {
      setTestStatus('Service Worker not supported');
      Alert.alert('Service Worker', 'Service Worker not supported in this browser');
    }
  };

  const checkPermissions = () => {
    if (Platform.OS === 'web') {
      const permission = Notification.permission;
      setTestStatus(`Notification Permission: ${permission}`);
      Alert.alert('Permissions', `Current permission status: ${permission}`);
    } else {
      setTestStatus('Permissions check only available on web');
      Alert.alert('Info', 'Permission check is only available on web platform');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="key" size={32} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          VAPID Keys Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test your Web Push notification setup
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
          Platform: {Platform.OS}
        </Text>
        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
          Supported: {isSupported ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
          Enabled: {isEnabled ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
          Initialized: {isInitialized ? 'Yes' : 'No'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testVapidKeys}
        >
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>
            Test VAPID Keys
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.secondary }]}
              onPress={testServiceWorker}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Test Service Worker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.success }]}
              onPress={checkPermissions}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Check Permissions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.warning }]}
              onPress={testWebPush}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Test Web Push
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {testStatus && (
        <View style={[styles.resultContainer, { backgroundColor: theme.colors.border + '20' }]}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            Test Results:
          </Text>
          <Text style={[styles.resultText, { color: theme.colors.textSecondary }]}>
            {testStatus}
          </Text>
        </View>
      )}

      <View style={[styles.infoContainer, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="information-circle" size={20} color={theme.colors.success} />
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          VAPID keys are required for web push notifications. Make sure your keys are properly configured.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});
