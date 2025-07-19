import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Card } from '../src/components/ui/Card';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { calculateAge } from '../src/utils/dateUtils';
import { isDesktopBrowser } from '../src/utils/platform';
import { getResponsiveFontSize, getResponsiveSpacing, isBreakpoint } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface MenuItem {
  key: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: 'navigate' | 'toggle' | 'alert';
  route?: string;
  value?: boolean;
  onPress?: () => void;
}

export default function MenuScreen() {
  const theme = useTheme();
  const { isWeb: isWebPlatform } = usePlatform();
  const { signOut, user, profile, loading } = useAuth();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  // Helper function to show alerts that work on both web and mobile
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWebPlatform) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const getDesktopFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const fontSizeMap = {
        xs: 16,
        sm: 18,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
      };
      return fontSizeMap[size];
    }
    return getResponsiveFontSize(size);
  };

  const getDesktopSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const spacingMap = {
        xs: 8,
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
        xxl: 64,
      };
      return spacingMap[size];
    }
    return getResponsiveSpacing(size);
  };

  const handleSignOut = async () => {
    if (isWebPlatform) {
      WebAlert.showConfirmation(
        'Sign Out',
        'Are you sure you want to sign out?',
        async () => {
          try {
            await signOut();
            router.replace('/login');
          } catch (error) {
            console.error('Sign out error:', error);
            showAlert('Error', 'Failed to sign out. Please try again.');
          }
        }
      );
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/login');
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your photos and information',
      icon: '👤',
      action: 'navigate',
      route: '/profile',
    },
    {
      key: 'account',
      title: 'Account Settings',
      subtitle: 'Manage your account and security',
      icon: '⚙️',
      action: 'navigate',
      route: '/account',
    },
    {
      key: 'preferences',
      title: 'Preferences',
      subtitle: 'Manage your dating preferences',
      icon: '🎯',
      action: 'navigate',
      route: '/preferences',
    },
    {
      key: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage push notifications',
      icon: '🔔',
      action: 'toggle',
      value: notifications,
      onPress: () => setNotifications(!notifications),
    },

    {
      key: 'darkMode',
      title: 'Dark Mode',
      subtitle: 'Switch between light and dark themes',
      icon: '🌙',
      action: 'toggle',
      value: darkMode,
      onPress: () => setDarkMode(!darkMode),
    },
    {
      key: 'privacy',
      title: 'Privacy & Safety',
      subtitle: 'Manage your privacy settings',
      icon: '🔒',
      action: 'navigate',
      route: '/privacy',
    },
    {
      key: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      action: 'alert',
      onPress: () => Alert.alert('Help', 'Contact us at support@sparkdating.com'),
    },
    {
      key: 'about',
      title: 'About Spark',
      subtitle: 'Learn more about the app',
      icon: 'ℹ️',
      action: 'alert',
      onPress: () => Alert.alert('About', 'Spark Dating App v1.0\nFind your perfect match!'),
    },
  ];

  const renderMenuItem = (item: MenuItem) => {
    const handlePress = () => {
      if (item.action === 'navigate' && item.route) {
        router.push(item.route as any);
      } else if (item.action === 'toggle' && item.onPress) {
        item.onPress();
      } else if (item.action === 'alert' && item.onPress) {
        item.onPress();
      }
    };

    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.menuItem,
          isDesktop && styles.desktopMenuItem
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <Text style={[
            styles.menuIcon,
            isDesktop && { fontSize: getDesktopFontSize('lg') }
          ]}>
            {item.icon}
          </Text>
          <View style={styles.menuTextContainer}>
            <Text style={[
              styles.menuTitle,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('md') }
            ]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[
                styles.menuSubtitle,
                { color: theme.colors.textSecondary },
                isDesktop && { fontSize: getDesktopFontSize('sm') }
              ]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {item.action === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={item.value ? '#fff' : '#f4f3f4'}
          />
        ) : (
          <Text style={[
            styles.arrow,
            { color: theme.colors.textSecondary },
            isDesktop && { fontSize: getDesktopFontSize('md') }
          ]}>
            →
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderUserProfile = () => {
    if (loading) {
      return (
        <View style={[styles.userProfileCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.userProfileContent}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.border }]} />
            <View style={styles.userInfoPlaceholder}>
              <View style={[styles.namePlaceholder, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.detailPlaceholder, { backgroundColor: theme.colors.border }]} />
            </View>
          </View>
        </View>
      );
    }

    if (!profile) {
      return null;
    }

    const avatarUrl = profile.photos && profile.photos.length > 0 
      ? profile.photos[0] 
      : null;

    return (
      <TouchableOpacity 
        style={[styles.userProfileCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push(`/user-profile?userId=${user?.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.userProfileContent}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>
                  {profile.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={[
              styles.userName,
              { color: theme.colors.text },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              {profile.first_name} {profile.last_name}
            </Text>
            
            <Text style={[
              styles.userDetails,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('sm') }
            ]}>
              {profile.birthdate ? `${calculateAge(profile.birthdate)} years old` : 'Age not set'}
              {profile.location && ` • ${profile.location}`}
            </Text>
            
            {profile.bio && (
              <Text 
                style={[
                  styles.userBio,
                  { color: theme.colors.textSecondary },
                  isDesktop && { fontSize: getDesktopFontSize('sm') }
                ]}
                numberOfLines={2}
              >
                {profile.bio}
              </Text>
            )}
          </View>
          
          <View style={styles.profileArrow}>
            <Text style={[
              styles.arrow,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              ›
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.desktopContent
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        
        <Text style={[
          styles.title,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('xxl') }
        ]}>
          Menu
        </Text>
        <Text style={[
          styles.subtitle,
          { color: theme.colors.textSecondary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          Manage your account and preferences
        </Text>
      </View>

      {/* User Profile Section */}
      {renderUserProfile()}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Settings
        </Text>
        <Card style={[styles.menuCard, isDesktop && styles.desktopMenuCard]} variant="elevated">
          {menuItems.map(renderMenuItem)}
        </Card>
      </View>

      <View style={[
        styles.signOutContainer,
        isDesktop && styles.desktopSignOutContainer
      ]}>
        <TouchableOpacity
          style={[
            styles.signOutButton,
            { backgroundColor: theme.colors.error }
          ]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.signOutIcon,
            isDesktop && { fontSize: getDesktopFontSize('md') }
          ]}>
            🚪
          </Text>
          <Text style={[
            styles.signOutText,
            { color: 'white' },
            isDesktop && { fontSize: getDesktopFontSize('md') }
          ]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getResponsiveSpacing('lg'),
    paddingTop: 60,
  },
  desktopContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: getResponsiveSpacing('xxl'),
  },
  header: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  backButton: {
    marginBottom: getResponsiveSpacing('md'),
  },
  backButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize('xxl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: getResponsiveFontSize('md'),
    color: '#666',
  },
  menuCard: {
    padding: getResponsiveSpacing('md'),
  },
  desktopMenuCard: {
    padding: getResponsiveSpacing('lg'),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  desktopMenuItem: {
    paddingVertical: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('md'),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('md'),
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
  },
  arrow: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  signOutContainer: {
    marginTop: getResponsiveSpacing('lg'),
    alignItems: 'center',
  },
  desktopSignOutContainer: {
    marginTop: getResponsiveSpacing('xl'),
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    minWidth: 200,
  },
  signOutIcon: {
    fontSize: getResponsiveFontSize('md'),
    marginRight: getResponsiveSpacing('sm'),
  },
  signOutText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  userProfileCard: {
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
  },
  userProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('md'),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  avatarText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: getResponsiveFontSize('sm'),
    color: '#666',
  },
  userBio: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: 4,
  },
  profileArrow: {
    marginLeft: getResponsiveSpacing('sm'),
    justifyContent: 'center',
  },
  userProfilePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: getResponsiveSpacing('md'),
  },
  userInfoPlaceholder: {
    flex: 1,
  },
  namePlaceholder: {
    width: '80%',
    height: getResponsiveFontSize('md'),
    marginBottom: 4,
    borderRadius: 4,
  },
  detailPlaceholder: {
    width: '60%',
    height: getResponsiveFontSize('sm'),
    borderRadius: 4,
  },
  menuSection: {
    marginTop: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
}); 