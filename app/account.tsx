import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Input } from '../src/components/ui/Input';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { AuthService } from '../src/services/auth';
import { calculateAge } from '../src/utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface AccountSetting {
  key: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action' | 'input';
  value?: boolean | string;
  icon?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  onInputChange?: (value: string) => void;
  route?: string;
  destructive?: boolean;
}

export default function AccountScreen() {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Account settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  
  // Edit states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Helper function to show alerts
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      setIsEditingEmail(false);
      setNewEmail(user?.email || '');
      return;
    }

    try {
      setLoading(true);
      await AuthService.updateEmail(newEmail);
      showAlert('Success', 'Email updated successfully. Please check your email to confirm the change.');
      setIsEditingEmail(false);
      await refreshProfile();
    } catch (error) {
      console.error('Error updating email:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to update email');
      setNewEmail(user?.email || '');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await AuthService.updatePassword(newPassword);
      showAlert('Success', 'Password updated successfully');
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, matches, and conversations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Final Confirmation',
              'This will permanently delete your account. Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      await AuthService.deleteAccount();
                      showAlert('Account Deleted', 'Your account has been permanently deleted.');
                      router.replace('/welcome');
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      showAlert('Error', 'Failed to delete account. Please try again or contact support.');
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🔐 AccountScreen: Starting sign out process');
              await signOut();
              console.log('✅ AccountScreen: Sign out successful, redirecting to homepage');
              router.replace('/welcome');
            } catch (error) {
              console.error('❌ AccountScreen: Sign out error:', error);
              showAlert(
                'Sign Out Failed', 
                'Failed to sign out. Please try again. If the problem persists, please restart the app.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const accountSettings: AccountSetting[] = [
    {
      key: 'notifications',
      title: 'Notification Settings',
      subtitle: 'Manage your notification preferences',
      type: 'navigation',
      route: '/preferences',
    },
    {
      key: 'privacy',
      title: 'Privacy Settings',
      subtitle: 'Control your privacy and data sharing',
      type: 'navigation',
      route: '/privacy',
    },
    {
      key: 'terms',
      title: 'Terms of Service',
      subtitle: 'View our terms and conditions',
      type: 'navigation',
      route: '/terms',
    },
    {
      key: 'support',
      title: 'Help & Support',
      subtitle: 'Get help or contact customer support',
      type: 'action',
      onPress: () => showAlert('Contact Support', 'Email us at support@datingapp.com for assistance.'),
    },
    {
      key: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Help us improve the app',
      type: 'action',
      onPress: () => showAlert('Feedback', 'Thank you for your interest in providing feedback! This feature will be available soon.'),
    },
  ];

  const privacySettings: AccountSetting[] = [
    {
      key: 'push_notifications',
      title: 'Push Notifications',
      subtitle: 'Receive push notifications for matches and messages',
      type: 'toggle',
      value: pushNotifications,
      onToggle: setPushNotifications,
    },
    {
      key: 'email_notifications',
      title: 'Email Notifications',
      subtitle: 'Receive email updates and newsletters',
      type: 'toggle',
      value: emailNotifications,
      onToggle: setEmailNotifications,
    },
    {
      key: 'location_sharing',
      title: 'Location Sharing',
      subtitle: 'Allow the app to access your location for matching',
      type: 'toggle',
      value: locationSharing,
      onToggle: setLocationSharing,
    },
    {
      key: 'profile_visibility',
      title: 'Profile Visibility',
      subtitle: 'Make your profile visible to other users',
      type: 'toggle',
      value: profileVisibility,
      onToggle: setProfileVisibility,
    },
    {
      key: 'online_status',
      title: 'Online Status',
      subtitle: 'Show when you were last active',
      type: 'toggle',
      value: onlineStatus,
      onToggle: setOnlineStatus,
    },
    {
      key: 'data_sharing',
      title: 'Analytics Data Sharing',
      subtitle: 'Help improve the app by sharing anonymous usage data',
      type: 'toggle',
      value: dataSharing,
      onToggle: setDataSharing,
    },
  ];

  const renderAccountInfo = () => (
    <Card style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
        <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
          {profile?.first_name} {profile?.last_name}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Age</Text>
        <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
          {profile?.birthdate ? `${calculateAge(profile.birthdate)} years old` : 'Not set'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
        {isEditingEmail ? (
          <View style={styles.editContainer}>
            <Input
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Enter new email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.editInput}
            />
            <View style={styles.editButtons}>
                             <Button
                 title="Cancel"
                 onPress={() => {
                   setIsEditingEmail(false);
                   setNewEmail(user?.email || '');
                 }}
                 variant="outline"
                 size="small"
                 style={styles.editButton}
               />
               <Button
                 title="Save"
                 onPress={handleUpdateEmail}
                 loading={loading}
                 size="small"
                 style={styles.editButton}
               />
            </View>
          </View>
        ) : (
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
              {user?.email}
            </Text>
            <TouchableOpacity
              onPress={() => setIsEditingEmail(true)}
              style={styles.editLink}
            >
              <Text style={[styles.editText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Member Since</Text>
        <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
        </Text>
      </View>
    </Card>
  );

  const renderPasswordSection = () => (
    <Card style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security</Text>
      
      {!isEditingPassword ? (
        <TouchableOpacity
          onPress={() => setIsEditingPassword(true)}
          style={styles.passwordRow}
        >
          <View>
            <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Change your account password
            </Text>
          </View>
          <Text style={[styles.editText, { color: theme.colors.primary }]}>Change</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.passwordContainer}>
          <Input
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
            style={styles.passwordInput}
          />
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
            style={styles.passwordInput}
          />
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            style={styles.passwordInput}
          />
          <View style={styles.editButtons}>
                         <Button
               title="Cancel"
               onPress={() => {
                 setIsEditingPassword(false);
                 setCurrentPassword('');
                 setNewPassword('');
                 setConfirmPassword('');
               }}
               variant="outline"
               size="small"
               style={styles.editButton}
             />
             <Button
               title="Update"
               onPress={handleUpdatePassword}
               loading={loading}
               size="small"
               style={styles.editButton}
             />
          </View>
        </View>
      )}
    </Card>
  );

  const renderPrivacySettings = () => (
    <Card style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy & Notifications</Text>
      
      {privacySettings.map((setting) => (
        <View key={setting.key} style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {setting.title}
            </Text>
            {setting.subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {setting.subtitle}
              </Text>
            )}
          </View>
          <Switch
            value={setting.value as boolean}
            onValueChange={setting.onToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>
      ))}
    </Card>
  );

  const renderAccountSettings = () => (
    <Card style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings & Support</Text>
      
      {accountSettings.map((setting) => (
        <TouchableOpacity
          key={setting.key}
          style={styles.settingRow}
          onPress={() => {
            if (setting.route) {
              router.push(setting.route as any);
            } else if (setting.onPress) {
              setting.onPress();
            }
          }}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {setting.title}
            </Text>
            {setting.subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {setting.subtitle}
              </Text>
            )}
          </View>
          <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );

  const renderDangerZone = () => (
    <Card style={[styles.section, styles.dangerSection]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
      
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
          Sign Out
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
          Delete Account
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Account</Text>
      </View>

      {renderAccountInfo()}
      {renderPasswordSection()}
      {renderPrivacySettings()}
      {renderAccountSettings()}
      {renderDangerZone()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('lg'),
    paddingTop: getResponsiveSpacing('sm'),
  },
  backButton: {
    marginRight: getResponsiveSpacing('md'),
  },
  backText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '500',
  },
  title: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  section: {
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  value: {
    fontSize: getResponsiveFontSize('md'),
    flex: 1,
    textAlign: 'right',
    marginLeft: getResponsiveSpacing('md'),
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  editLink: {
    marginLeft: getResponsiveSpacing('sm'),
  },
  editText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  editContainer: {
    flex: 1,
    marginLeft: getResponsiveSpacing('md'),
  },
  editInput: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  editButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  editButton: {
    flex: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: 2,
  },
  passwordContainer: {
    gap: getResponsiveSpacing('sm'),
  },
  passwordInput: {
    marginBottom: 0,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: 2,
  },
  arrow: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: '300',
  },
  dangerSection: {
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderWidth: 1,
  },
  dangerButton: {
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 69, 58, 0.2)',
  },
  dangerButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    textAlign: 'center',
  },
}); 