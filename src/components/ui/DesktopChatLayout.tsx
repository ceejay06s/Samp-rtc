import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface DesktopChatLayoutProps {
  children: React.ReactNode;
  otherUserName?: string;
  otherUserProfile?: any;
  isOtherUserOnline?: boolean;
  onBack?: () => void;
  conversationId?: string;
}

export const DesktopChatLayout: React.FC<DesktopChatLayoutProps> = ({
  children,
  otherUserName = 'User',
  otherUserProfile,
  isOtherUserOnline = false,
  onBack,
  conversationId
}) => {
  const theme = useTheme();
  const { isDesktopBrowser } = usePlatform();
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // Only render on desktop
  if (!isDesktopBrowser) {
    return <>{children}</>;
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Main Chat Area */}
      <View style={styles.chatArea}>
        {/* Chat Header */}
        <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {otherUserName}
              </Text>
              <View style={styles.onlineStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isOtherUserOnline ? theme.colors.success : theme.colors.textSecondary }
                ]} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                  {isOtherUserOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowInfoPanel(!showInfoPanel)}
            >
              <MaterialIcons 
                name={showInfoPanel ? "info" : "info-outline"} 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="more-vert" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Content */}
        <View style={styles.chatContent}>
          {children}
        </View>
      </View>

      {/* Info Panel */}
      {showInfoPanel && (
        <View style={[styles.infoPanel, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoHeader}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Chat Info
            </Text>
            <TouchableOpacity
              style={styles.closeInfoButton}
              onPress={() => setShowInfoPanel(false)}
            >
              <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.infoContent} showsVerticalScrollIndicator={false}>
            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {otherUserProfile?.photos?.[0] ? (
                    <View style={styles.avatar}>
                      {/* Avatar image would go here */}
                      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                        <Text style={[styles.avatarText, { color: '#fff' }]}>
                          {otherUserName.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                      <Text style={[styles.avatarText, { color: '#fff' }]}>
                        {otherUserName.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.colors.text }]}>
                    {otherUserName}
                  </Text>
                  <View style={styles.onlineStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: isOtherUserOnline ? theme.colors.success : theme.colors.textSecondary }
                    ]} />
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                      {isOtherUserOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* User Details */}
              {otherUserProfile && (
                <View style={styles.userDetails}>
                  {otherUserProfile.birthdate && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="cake" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.detailText, { color: theme.colors.text }]}>
                        {calculateAge(otherUserProfile.birthdate)} years old
                      </Text>
                    </View>
                  )}
                  
                  {otherUserProfile.location && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="location-on" size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.detailText, { color: theme.colors.text }]}>
                        {otherUserProfile.location}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Bio Section */}
            {otherUserProfile?.bio && (
              <View style={styles.bioSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Bio
                </Text>
                <Text style={[styles.bioText, { color: theme.colors.text }]}>
                  {otherUserProfile.bio}
                </Text>
              </View>
            )}

            {/* Interests Section */}
            {otherUserProfile?.interests && otherUserProfile.interests.length > 0 && (
              <View style={styles.interestsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Interests
                </Text>
                <View style={styles.interestsList}>
                  {otherUserProfile.interests.slice(0, 6).map((interest: string, index: number) => (
                    <View key={index} style={[styles.interestChip, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={[styles.interestText, { color: theme.colors.primary }]}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                  {otherUserProfile.interests.length > 6 && (
                    <Text style={[styles.moreInterests, { color: theme.colors.textSecondary }]}>
                      +{otherUserProfile.interests.length - 6} more
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Chat Stats Section */}
            <View style={styles.statsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Chat Statistics
              </Text>
              <View style={styles.statsList}>
                <View style={styles.statRow}>
                  <MaterialIcons name="message" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.statText, { color: theme.colors.text }]}>
                    Messages exchanged
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.statText, { color: theme.colors.text }]}>
                    Conversation started
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.actionsSection}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                <MaterialIcons name="block" size={16} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>
                  Block User
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.error }]}>
                <MaterialIcons name="report" size={16} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>
                  Report
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh' as any,
  },
  chatArea: {
    flex: 1,
    display: 'flex' as any,
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 70,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: getResponsiveSpacing('sm'),
    marginRight: getResponsiveSpacing('md'),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: getResponsiveSpacing('xs'),
  },
  statusText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: getResponsiveSpacing('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  chatContent: {
    flex: 1,
    overflow: 'hidden',
  },
  infoPanel: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    display: 'flex' as any,
    flexDirection: 'column',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  closeInfoButton: {
    padding: getResponsiveSpacing('xs'),
  },
  infoContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  profileSection: {
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  avatarContainer: {
    marginRight: getResponsiveSpacing('md'),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  userDetails: {
    marginTop: getResponsiveSpacing('md'),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  detailText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  bioSection: {
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  bioText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  interestsSection: {
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  interestChip: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('lg'),
  },
  interestText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: getResponsiveFontSize('xs'),
    fontStyle: 'italic',
    alignSelf: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
  statsSection: {
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsList: {
    gap: getResponsiveSpacing('sm'),
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  actionsSection: {
    paddingVertical: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('sm'),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
  },
  actionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('sm'),
  },
}); 