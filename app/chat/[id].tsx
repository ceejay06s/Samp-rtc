import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { EnhancedRealtimeChat } from '../../src/components/ui/EnhancedRealtimeChat';
import { useNavigationTracking } from '../../src/hooks/useNavigationTracking';
import { usePlatform } from '../../src/hooks/usePlatform';
import { AuthService } from '../../src/services/auth';
import { AuthStateService } from '../../src/services/authStateService';
import { MessagingService } from '../../src/services/messaging';
import { Profile } from '../../src/types';
import { useTheme } from '../../src/utils/themes';

export default function ChatScreen() {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const { getReferrerUrl, getReferrerUrlSync } = useNavigationTracking();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<any>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null);

  // Helper function to show alerts
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      // Use web alert for web platform
      alert(`${title}${message ? `: ${message}` : ''}`);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Set user as active when entering chat
  useEffect(() => {
    const setUserActive = async () => {
      if (currentUser?.id) {
        try {
          console.log('💬 ChatScreen: Setting user as active');
          await AuthStateService.getInstance().setOnlineStatus(true);
          console.log('✅ ChatScreen: User set as active');
        } catch (error) {
          console.warn('⚠️ ChatScreen: Failed to set user as active:', error);
        }
      }
    };

    setUserActive();

    // Cleanup: Set user as inactive when leaving chat
    return () => {
      const cleanup = async () => {
        if (currentUser?.id) {
          try {
            console.log('💬 ChatScreen: Setting user as inactive (leaving chat)');
            await AuthStateService.getInstance().setOnlineStatus(false);
            console.log('✅ ChatScreen: User set as inactive');
          } catch (error) {
            console.warn('⚠️ ChatScreen: Failed to set user as inactive:', error);
          }
        }
      };
      cleanup();
    };
  }, [currentUser?.id]);

  // Save referrer URL when component mounts
  useEffect(() => {
    const saveReferrer = async () => {
      try {
        // Try to get referrer URL asynchronously (works on all platforms)
        const currentUrl = await getReferrerUrl();
        
        // Only save referrer if it's not already a chat URL
        if (currentUrl && !currentUrl.includes('/chat/')) {
          setReferrerUrl(currentUrl);
          console.log('📱 Saved referrer URL:', currentUrl);
        } else {
          console.log('📱 No referrer saved (already in chat or no previous URL)');
        }
      } catch (error) {
        console.warn('📱 Failed to get referrer URL:', error);
      }
    };

    saveReferrer();
  }, [getReferrerUrl]);

  // Handle back navigation
  const handleBackNavigation = () => {
    if (referrerUrl) {
      console.log('📱 Navigating back to:', referrerUrl);
      router.push(referrerUrl as any);
    } else {
      console.log('📱 No referrer, using default back navigation');
      router.back();
    }
  };

  useEffect(() => {
    const loadConversationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!currentUser?.id) {
          setError('Please sign in to access chat');
          console.log('❌ ChatScreen: User not authenticated');
          return;
        }

        if (!conversationId) {
          setError('No conversation ID provided');
          return;
        }

        console.log('💬 ChatScreen: Loading conversation data for user:', currentUser.id);

        // Load conversation details
        const conversations = await MessagingService.getConversations(currentUser.id);
        const conversationData = conversations.find(c => c.id === conversationId);
        
        if (!conversationData) {
          setError('Conversation not found');
          console.log('❌ ChatScreen: Conversation not found:', conversationId);
          return;
        }

        setConversation(conversationData);
        console.log('✅ ChatScreen: Conversation loaded:', conversationData.id);

        // Get the other user's ID (not the current user)
        // Since participants is an array of user IDs, we need to find the one that's not the current user
        const participants = conversationData.participants || [];
        const otherUserId = participants.find(
          (userId: string) => userId !== currentUser?.id
        );

        if (otherUserId) {
          // Load the other user's profile
          const profileData = await AuthService.getUserProfile(otherUserId);
          setOtherProfile(profileData);
          console.log('✅ ChatScreen: Other user profile loaded:', profileData?.first_name);
          
          // Set up real-time online status tracking
          setIsOtherUserOnline(profileData?.is_online || false);
          console.log('📡 ChatScreen: Other user online status:', profileData?.is_online);
        }
      } catch (err) {
        console.error('❌ ChatScreen: Error loading conversation:', err);
        setError('Failed to load conversation');
        showAlert('Error', 'Failed to load conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id && conversationId) {
      loadConversationData();
    }
  }, [conversationId, currentUser?.id]);

  // Show authentication error if user is not signed in
  if (!currentUser?.id) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Please Sign In
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
          You need to be signed in to access chat conversations.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  if (error || !conversation) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Conversation not found'}
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
          The conversation you're looking for doesn't exist or you don't have access to it.
        </Text>
      </View>
    );
  }

  const otherUserName = otherProfile?.first_name || 'User';

  // Use DesktopChatLayout for desktop browsers
  // if (isDesktopBrowser) {
  //   return (
  //     <DesktopChatLayout
  //       otherUserName={otherUserName}
  //       otherUserProfile={otherProfile}
  //       isOtherUserOnline={isOtherUserOnline}
  //       onBack={() => router.back()}
  //       conversationId={conversationId}
  //     >
  //       <EnhancedRealtimeChat
  //         conversationId={conversation.id}
  //         otherUserName={otherUserName}
  //       />
  //     </DesktopChatLayout>
  //   );
  // }

  // Use regular layout for mobile
  return (
    <View style={styles.container}>
      <EnhancedRealtimeChat
        conversationId={conversation.id}
        otherUserName={otherUserName}
        onBack={handleBackNavigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
}); 