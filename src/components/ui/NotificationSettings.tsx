import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme } from '../../utils/themes';
import { NotificationIcon } from './NotificationIcon';

export const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const {
    isSupported,
    isEnabled,
    isInitialized,
    preferences,
    updatePreferences,
    requestPermissions,
    isInQuietHours,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = async (key: keyof NonNullable<typeof preferences>, value: boolean) => {
    if (!localPreferences) return;

    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);

    try {
      setIsLoading(true);
      const success = await updatePreferences({ [key]: value });
      if (!success) {
        // Revert on failure
        setLocalPreferences(preferences);
        Alert.alert('Error', 'Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setLocalPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = async (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!localPreferences) return;

    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);

    try {
      setIsLoading(true);
      const success = await updatePreferences({ [key]: value });
      if (!success) {
        setLocalPreferences(preferences);
        Alert.alert('Error', 'Failed to update quiet hours');
      }
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      setLocalPreferences(preferences);
      Alert.alert('Error', 'Failed to update quiet hours');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestPermissions();
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your browser settings to receive notifications.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  if (!isInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <NotificationIcon size={48} variant="active" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Initializing notifications...
          </Text>
        </View>
      </View>
    );
  }

  if (!isSupported) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.unsupportedContainer}>
          <Ionicons name="notifications-off" size={48} color={theme.colors.error} />
          <Text style={[styles.unsupportedTitle, { color: theme.colors.text }]}>
            Notifications Not Supported
          </Text>
          <Text style={[styles.unsupportedText, { color: theme.colors.textSecondary }]}>
            Your device or browser doesn't support push notifications.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationIcon size={32} variant="active" />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Notification Settings
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Customize how and when you receive notifications
        </Text>
      </View>

      {/* Permission Status */}
      <View style={[styles.section, { backgroundColor: theme.colors.border + '20' }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Permission Status
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
            Notifications Enabled
          </Text>
          <View style={styles.statusValue}>
            {isEnabled ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            ) : (
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            )}
          </View>
        </View>

        {!isEnabled && Platform.OS === 'web' && (
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRequestPermissions}
            disabled={isLoading}
          >
            <Text style={[styles.permissionButtonText, { color: theme.colors.background }]}>
              Enable Notifications
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* General Settings */}
      <View style={[styles.section, { backgroundColor: theme.colors.border + '20' }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            General Settings
          </Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Push Notifications
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Enable or disable all push notifications
            </Text>
          </View>
          <Switch
            value={localPreferences?.push_enabled ?? true}
            onValueChange={(value) => handleToggle('push_enabled', value)}
            disabled={isLoading || !isEnabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.push_enabled ? theme.colors.primary : theme.colors.border}
          />
        </View>

        {Platform.OS !== 'web' && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Sound
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Play sound for notifications
                </Text>
              </View>
              <Switch
                value={localPreferences?.sound_enabled ?? true}
                onValueChange={(value) => handleToggle('sound_enabled', value)}
                disabled={isLoading || !localPreferences?.push_enabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={localPreferences?.sound_enabled ? theme.colors.primary : theme.colors.border}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Vibration
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={localPreferences?.vibration_enabled ?? true}
                onValueChange={(value) => handleToggle('vibration_enabled', value)}
                disabled={isLoading || !localPreferences?.push_enabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={localPreferences?.vibration_enabled ? theme.colors.primary : theme.colors.border}
              />
            </View>
          </>
        )}
      </View>

      {/* Notification Types */}
      <View style={[styles.section, { backgroundColor: theme.colors.border + '20' }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Notification Types
          </Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              New Messages
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Notify when you receive new messages
            </Text>
          </View>
          <Switch
            value={localPreferences?.message_notifications ?? true}
            onValueChange={(value) => handleToggle('message_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.message_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              New Matches
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Notify when you get a new match
            </Text>
          </View>
          <Switch
            value={localPreferences?.match_notifications ?? true}
            onValueChange={(value) => handleToggle('match_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.match_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              New Posts
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Notify when followed users post
            </Text>
          </View>
          <Switch
            value={localPreferences?.post_notifications ?? true}
            onValueChange={(value) => handleToggle('post_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.post_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              New Comments
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Notify when someone comments on your posts
            </Text>
          </View>
          <Switch
            value={localPreferences?.comment_notifications ?? true}
            onValueChange={(value) => handleToggle('comment_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.comment_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Typing Indicators
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Show when someone is typing
            </Text>
          </View>
          <Switch
            value={localPreferences?.typing_notifications ?? false}
            onValueChange={(value) => handleToggle('typing_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.typing_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Online Status
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Notify when matches come online
            </Text>
          </View>
          <Switch
            value={localPreferences?.online_status_notifications ?? false}
            onValueChange={(value) => handleToggle('online_status_notifications', value)}
            disabled={isLoading || !localPreferences?.push_enabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={localPreferences?.online_status_notifications ? theme.colors.primary : theme.colors.border}
          />
        </View>
      </View>

      {/* Quiet Hours */}
      <View style={[styles.section, { backgroundColor: theme.colors.border + '20' }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="moon" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quiet Hours
          </Text>
        </View>
        
        <Text style={[styles.quietHoursDescription, { color: theme.colors.textSecondary }]}>
          During quiet hours, only in-app notifications will be shown
        </Text>

        <View style={styles.quietHoursStatus}>
          <Text style={[styles.quietHoursLabel, { color: theme.colors.text }]}>
            Current Status:
          </Text>
          <Text style={[
            styles.quietHoursValue,
            { color: isInQuietHours() ? theme.colors.warning : theme.colors.success }
          ]}>
            {isInQuietHours() ? 'Quiet Hours Active' : 'Normal Hours'}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Text style={[styles.timeLabel, { color: theme.colors.text }]}>Start Time</Text>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => {
                // In a real app, you'd show a time picker here
                Alert.alert('Time Picker', 'Select start time for quiet hours');
              }}
            >
              <Text style={[styles.timeButtonText, { color: theme.colors.text }]}>
                {localPreferences?.quiet_hours_start || '22:00'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeInput}>
            <Text style={[styles.timeLabel, { color: theme.colors.text }]}>End Time</Text>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => {
                // In a real app, you'd show a time picker here
                Alert.alert('Time Picker', 'Select end time for quiet hours');
              }}
            >
              <Text style={[styles.timeButtonText, { color: theme.colors.text }]}>
                {localPreferences?.quiet_hours_end || '08:00'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Changes are saved automatically
        </Text>
      </View>
    </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    alignItems: 'center',
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  quietHoursDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  quietHoursStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quietHoursLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  quietHoursValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
