import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { EnhancedRealtimeChat } from '../../src/components/ui/EnhancedRealtimeChat';
import { IconNames, MaterialIcon } from '../../src/components/ui/MaterialIcon';
import { RealtimeChat } from '../../src/components/ui/RealtimeChat';
import { usePlatform } from '../../src/hooks/usePlatform';
import { useViewport } from '../../src/hooks/useViewport';
import { MessagingService } from '../../src/services/messaging';
import { Conversation } from '../../src/types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../src/utils/responsive';
import { useTheme } from '../../src/utils/themes';

export default function ChatScreen() {
  const theme = useTheme();
  const { user, profile: currentUserProfile } = useAuth();
  const { isWeb } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isWeb;
  const params = useLocalSearchParams();
  const { id: conversationOrMatchId } = params as { id: string };

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useEnhancedChat, setUseEnhancedChat] = useState(true); // Toggle between basic and enhanced

  const loadConversation = useCallback(async () => {
    if (!user?.id || !conversationOrMatchId) {
      setError('Invalid user or conversation/match ID.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      let currentConversation: Conversation | null = null;

      // Check if it's a conversation ID or a match ID
      if (conversationOrMatchId.startsWith('conv-')) {
        const fetchedConversations = await MessagingService.getConversations(user.id);
        currentConversation = fetchedConversations.find(c => c.id === conversationOrMatchId) || null;
      } else if (conversationOrMatchId.startsWith('match-')) {
        currentConversation = await MessagingService.getOrCreateConversation(conversationOrMatchId, user.id);
      } else {
        // Try to find by conversation ID directly
        const fetchedConversations = await MessagingService.getConversations(user.id);
        currentConversation = fetchedConversations.find(c => c.id === conversationOrMatchId) || null;
        
        if (!currentConversation) {
          // Try as match ID
          currentConversation = await MessagingService.getOrCreateConversation(conversationOrMatchId, user.id);
        }
      }

      if (!currentConversation) {
        throw new Error('Conversation not found or could not be created.');
      }

      setConversation(currentConversation);

      // Mark messages as read
      if (currentConversation.unreadCount && currentConversation.unreadCount > 0) {
        await MessagingService.markMessagesAsRead(currentConversation.id, user.id);
      }

    } catch (err) {
      console.error('❌ Failed to load chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, conversationOrMatchId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const otherProfile = conversation?.otherProfile;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.errorCard}>
          <MaterialIcon name={IconNames.error} size={48} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Error Loading Chat</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <View style={styles.errorButtons}>
            <Button title="Try Again" onPress={loadConversation} variant="primary" />
          </View>
        </Card>
      </View>
    );
  }

  if (!conversation || !otherProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.errorCard}>
          <MaterialIcon name={IconNames.error} size={48} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>Chat Not Found</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            The conversation could not be loaded. It might not exist or you don&apos;t have access.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </Card>
      </View>
    );
  }

  // Use the Enhanced RealtimeChat component for advanced features
  return (
    <View style={styles.container}>
      {/* Chat Mode Toggle (for demonstration) */}
      {isWeb && (
        <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.toggleText, { color: theme.colors.textSecondary }]}>
            Chat Mode:
          </Text>
          <Button
            title={useEnhancedChat ? "Enhanced" : "Basic"}
            onPress={() => setUseEnhancedChat(!useEnhancedChat)}
            variant={useEnhancedChat ? "primary" : "secondary"}
            style={styles.toggleButton}
          />
        </View>
      )}
      
      {/* Chat Component */}
      {useEnhancedChat ? (
        <EnhancedRealtimeChat
          conversationId={conversation.id}
          otherUserName={otherProfile.first_name}
          onBack={() => router.back()}
        />
      ) : (
        <RealtimeChat
          conversationId={conversation.id}
          otherUserName={otherProfile.first_name}
          onBack={() => router.back()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleText: {
    fontSize: getResponsiveFontSize('sm'),
    marginRight: getResponsiveSpacing('sm'),
  },
  toggleButton: {
    minWidth: 80,
  },
  loadingText: {
    marginTop: getResponsiveSpacing('md'),
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
  },
  errorCard: {
    margin: getResponsiveSpacing('xl'),
    padding: getResponsiveSpacing('xl'),
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: '600',
    marginTop: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
    lineHeight: getResponsiveFontSize('lg'),
  },
  errorButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('md'),
  },
}); 