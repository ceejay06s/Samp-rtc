import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { IconNames, MaterialIcon } from '../src/components/ui/MaterialIcon';
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';
import { MessagingService } from '../src/services/messaging';
import { Conversation } from '../src/types';
import { formatLocationForDisplay } from '../src/utils/location';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

// Helper function to format timestamp
const formatMessageTime = (timestamp: Date | string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export default function MessagesScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { isWeb } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isWeb;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setError('Please log in to view your conversations');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('💬 Loading conversations for user:', user.id);
      
      const conversationsData = await MessagingService.getConversations(user.id);
      console.log('✅ Loaded conversations:', conversationsData.length);
      
      setConversations(conversationsData);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
      
      // For development, show mock conversations
      setConversations(getMockConversations());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to the chat screen with the conversation ID
    router.push(`/chat/${conversation.id}`);
  };

  const handleMarkAsRead = async (conversation: Conversation) => {
    if (!user?.id) return;
    
    try {
      await MessagingService.markMessagesAsRead(conversation.id, user.id);
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mock conversations for development
  const getMockConversations = (): Conversation[] => [
    {
      id: 'mock-conv-1',
      match_id: 'mock-match-1',
      matchId: 'mock-match-1',
      participants: [user?.id || '', 'mock-user-1'],
      lastMessage: {
        id: 'mock-msg-1',
        conversation_id: 'mock-conv-1',
        sender_id: 'mock-user-1',
        content: 'Hey! How was your hiking trip last weekend? 🏔️',
        message_type: 'text',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false
      },
      unread_count: 2,
      unreadCount: 2,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      otherProfile: {
        id: 'mock-profile-1',
        user_id: 'mock-user-1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        birthdate: '1995-06-15',
        gender: 'female',
        bio: 'Love hiking and photography',
        photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=faces'],
        interests: ['hiking', 'photography'],
        location: 'San Francisco, CA',
        latitude: 37.7749,
        longitude: -122.4194,
        is_online: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_distance: 25,
        looking_for: ['male'],
        min_age: 25,
        max_age: 35
      }
    },
    {
      id: 'mock-conv-2',
      match_id: 'mock-match-2',
      matchId: 'mock-match-2',
      participants: [user?.id || '', 'mock-user-2'],
      lastMessage: {
        id: 'mock-msg-2',
        conversation_id: 'mock-conv-2',
        sender_id: user?.id || '',
        content: 'Thanks for the restaurant recommendation! 🍽️',
        message_type: 'text',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'text',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true
      },
      unread_count: 0,
      unreadCount: 0,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      otherProfile: {
        id: 'mock-profile-2',
        user_id: 'mock-user-2',
        first_name: 'Emma',
        last_name: 'Davis',
        birthdate: '1992-03-22',
        gender: 'female',
        bio: 'Yoga instructor and foodie',
        photos: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=faces'],
        interests: ['yoga', 'cooking'],
        location: 'Oakland, CA',
        latitude: 37.8044,
        longitude: -122.2711,
        is_online: false,
        last_seen: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_distance: 30,
        looking_for: ['male'],
        min_age: 28,
        max_age: 38
      }
    }
  ];

  const renderConversationItem = ({ item: conversation }: { item: Conversation }) => {
    const otherProfile = conversation.otherProfile;
    
    if (!otherProfile) {
      return null; // Skip conversations without profile data
    }

    const hasUnread = (conversation.unreadCount || 0) > 0;
    const lastMessage = conversation.lastMessage;
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.colors.surface },
          hasUnread && { backgroundColor: `${theme.colors.primary}15` }
        ]}
        onPress={() => handleConversationPress(conversation)}
        activeOpacity={0.7}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherProfile.photos?.[0] || 'https://via.placeholder.com/60x60/FF6B9D/FFFFFF?text=No+Photo'
            }}
            style={styles.avatar}
            resizeMode="cover"
          />
          {otherProfile.is_online && (
            <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                { color: theme.colors.text },
                hasUnread && styles.unreadText
              ]}
              numberOfLines={1}
            >
              {otherProfile.first_name}
            </Text>
            <View style={styles.conversationMeta}>
              {lastMessage && (
                <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                  {formatMessageTime(lastMessage.timestamp || new Date())}
                </Text>
              )}
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.unreadCount}>
                    {(conversation.unreadCount || 0) > 99 ? '99+' : conversation.unreadCount || 0}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                { color: theme.colors.textSecondary },
                hasUnread && { color: theme.colors.text, fontWeight: '500' }
              ]}
              numberOfLines={2}
            >
              {lastMessage 
                ? (lastMessage.senderId === user?.id ? 'You: ' : '') + lastMessage.content
                : 'Start a conversation...'
              }
            </Text>
          </View>

          {formatLocationForDisplay(otherProfile.location, 'city-state') && (
            <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
              📍 {formatLocationForDisplay(otherProfile.location, 'city-state')}
            </Text>
          )}
        </View>
        <MaterialIcon name={IconNames.forward} size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        Start discovering and matching with people to begin conversations!
      </Text>
      <View style={styles.emptyActions}>
        <Button
          title="Discover People"
          onPress={() => router.push('/discover')}
          variant="primary"
          style={styles.emptyButton}
        />
        <Button
          title="View Matches"
          onPress={() => router.push('/matches')}
          variant="secondary"
          style={styles.emptyButton}
        />
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, isDesktop && styles.desktopHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[
            styles.title, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('xxl') }
          ]}>
            Messages
          </Text>
          <View style={{ width: 50 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your conversations...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, isDesktop && styles.desktopHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[
            styles.title, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('xxl') }
          ]}>
            Messages
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={[styles.refreshButton, { color: theme.colors.primary }]}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.errorCard}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Try Again"
            onPress={() => loadConversations()}
            variant="primary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, isDesktop && styles.desktopHeader]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[
          styles.title, 
          { color: theme.colors.text },
          isDesktop && { fontSize: getResponsiveFontSize('xxl') }
        ]}>
          Messages ({conversations.length})
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={[styles.refreshButton, { color: theme.colors.primary }]}>🔄</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            isDesktop && styles.desktopListContainer
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  desktopHeader: {
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('lg'),
  },
  backButton: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  refreshButton: {
    fontSize: getResponsiveFontSize('lg'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginTop: getResponsiveSpacing('md'),
  },
  errorCard: {
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
    margin: getResponsiveSpacing('lg'),
  },
  errorTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
  },
  listContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('xl'),
  },
  desktopListContainer: {
    paddingHorizontal: getResponsiveSpacing('xl'),
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    borderRadius: 12,
    marginBottom: getResponsiveSpacing('xs'),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing('md'),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  conversationName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
  },
  timestamp: {
    fontSize: getResponsiveFontSize('sm'),
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: 'bold',
  },
  messagePreview: {
    marginBottom: getResponsiveSpacing('xs'),
  },
  lastMessage: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.3,
  },
  location: {
    fontSize: getResponsiveFontSize('sm'),
  },
  separator: {
    height: 1,
    marginLeft: 76, // Align with text content
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('xl'),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  emptyActions: {
    gap: getResponsiveSpacing('md'),
    width: '100%',
    maxWidth: 300,
  },
  emptyButton: {
    width: '100%',
  },
}); 