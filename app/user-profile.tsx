import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { CreatePost } from '../src/components/ui/CreatePost';
import { ListItem } from '../src/components/ui/ListItem';
import { PostCard } from '../src/components/ui/PostCard';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { AuthService } from '../src/services/auth';
import { CreatePostData, PostService } from '../src/services/postService';
import { Post, Profile } from '../src/types';
import { calculateAge } from '../src/utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function UserProfileScreen() {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  const isOwnProfile = currentUser?.id === userId;

  // Helper function to show alerts
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const loadProfile = async () => {
    try {
      if (!userId) {
        showAlert('Error', 'No user ID provided.');
        router.back();
        return;
      }

      const profileData = await AuthService.getUserProfile(userId);
      if (!profileData) {
        showAlert('Error', 'User profile not found.');
        router.back();
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      showAlert('Error', 'Failed to load user profile. Please try again.');
      router.back();
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      
      if (!userId) {
        console.warn('No userId provided for loading posts');
        setPosts([]);
        return;
      }

      const userPosts = await PostService.getUserPosts(userId, isOwnProfile);
      
      // Add liked status for current user
      const postsWithLikeStatus = await Promise.all(
        userPosts.map(async (post) => {
          if (currentUser?.id) {
            try {
              const fullPost = await PostService.getPost(post.id, currentUser.id);
              return fullPost || post;
            } catch (error) {
              console.warn('Failed to get full post data:', error);
              return post;
            }
          }
          return post;
        })
      );
      
      setPosts(postsWithLikeStatus);
    } catch (error) {
      console.error('Error loading posts:', error);
      // Don't show alert for posts loading failure, just set empty array
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadPosts()]);
    setRefreshing(false);
  }, [userId, isOwnProfile]);

  const handleCreatePost = async (postData: CreatePostData) => {
    try {
      if (!currentUser?.id) {
        showAlert('Error', 'You must be logged in to create a post.');
        return;
      }

      const newPost = await PostService.createPost(currentUser.id, postData);
      setPosts(prev => [newPost, ...prev]);
      setShowCreatePost(false);
      showAlert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to create post.');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      if (!currentUser?.id) return;
      
      await PostService.likePost(postId, currentUser.id);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, liked_by_current_user: true, likes_count: (post.likes_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      showAlert('Error', 'Failed to like post.');
    }
  };

  const handleUnlikePost = async (postId: string) => {
    try {
      if (!currentUser?.id) return;
      
      await PostService.unlikePost(postId, currentUser.id);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, liked_by_current_user: false, likes_count: Math.max((post.likes_count || 0) - 1, 0) }
          : post
      ));
    } catch (error) {
      console.error('Error unliking post:', error);
      showAlert('Error', 'Failed to unlike post.');
    }
  };

  const handleCommentPost = async (postId: string, content: string) => {
    try {
      if (!currentUser?.id) return;
      
      await PostService.addComment(postId, currentUser.id, content);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error commenting on post:', error);
      showAlert('Error', 'Failed to add comment.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    showAlert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUser?.id) return;
              
              await PostService.deletePost(postId, currentUser.id);
              setPosts(prev => prev.filter(post => post.id !== postId));
              showAlert('Success', 'Post deleted successfully.');
            } catch (error) {
              console.error('Error deleting post:', error);
              showAlert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    // TODO: Implement full-screen image viewer
    console.log('Image pressed:', imageUrl, index);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadProfile(), loadPosts()]);
      setLoading(false);
    };

    if (userId) {
      loadData();
    }
  }, [userId, isOwnProfile]);

  const renderProfileHeader = () => {
    if (!profile) {
      return (
        <ListItem style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>?</Text>
              </View>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                User Profile
              </Text>
              <Text style={[styles.userAge, { color: theme.colors.textSecondary }]}>
                Profile not available
              </Text>
            </View>
          </View>
        </ListItem>
      );
    }

    const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
    const displayName = profile.first_name || 'User';
    const displayLastName = profile.last_name || '';
    const fullName = `${displayName} ${displayLastName}`.trim() || 'User';

    return (
      <ListItem style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>
                  {displayName.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {fullName}
            </Text>
            
            <View style={styles.userMeta}>
              {profile.birthdate && (
                <Text style={[styles.userAge, { color: theme.colors.textSecondary }]}>
                  {calculateAge(profile.birthdate)} years old
                </Text>
              )}
              {profile.location && (
                <Text style={[styles.userLocation, { color: theme.colors.textSecondary }]}>
                  📍 {profile.location}
                </Text>
              )}
            </View>

            {profile.bio && (
              <Text style={[styles.userBio, { color: theme.colors.text }]}>
                {profile.bio}
              </Text>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 5).map((interest, index) => (
                  <View key={index} style={[styles.interest, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.interestText, { color: '#fff' }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
                {profile.interests.length > 5 && (
                  <Text style={[styles.moreInterests, { color: theme.colors.textSecondary }]}>
                    +{profile.interests.length - 5} more
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.profileActions}>
          {isOwnProfile ? (
            <Button
              title="Edit Profile"
              onPress={() => router.push('/profile')}
              variant="outline"
              style={styles.actionButton}
            />
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title="Message"
                onPress={() => {
                  // TODO: Implement messaging
                  showAlert('Coming Soon', 'Messaging feature will be available soon!');
                }}
                style={styles.actionButton}
              />
              <Button
                title="Like"
                onPress={() => {
                  // TODO: Implement like/match functionality
                  showAlert('Coming Soon', 'Like feature will be available soon!');
                }}
                variant="accent"
                style={styles.actionButton}
              />
            </View>
          )}
        </View>
      </ListItem>
    );
  };

  const renderPostsHeader = () => (
    <View style={styles.postsHeader}>
      <Text style={[styles.postsTitle, { color: theme.colors.text }]}>
        {isOwnProfile ? 'Your Posts' : 'Posts'} ({posts.length})
      </Text>
      
      {isOwnProfile && (
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Text style={[styles.createPostText, { color: theme.colors.primary }]}>
            + Create Post
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={currentUser?.id}
      onLike={handleLikePost}
      onUnlike={handleUnlikePost}
      onComment={handleCommentPost}
      onImagePress={handleImagePress}
      isOwnPost={isOwnProfile}
      onDelete={handleDeletePost}
    />
  );

  const renderEmptyPosts = () => (
    <ListItem style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {isOwnProfile ? 'No posts yet' : 'No public posts'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {isOwnProfile 
          ? 'Share your first post to get started!' 
          : 'This user hasn\'t shared any public posts yet.'
        }
      </Text>
      {isOwnProfile && (
        <Button
          title="Create Your First Post"
          onPress={() => setShowCreatePost(true)}
          style={styles.emptyAction}
        />
      )}
    </ListItem>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (showCreatePost) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CreatePost
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreatePost(false)}
          isWeb={isWeb}
          userProfile={profile || undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isOwnProfile ? 'My Profile' : 'Profile'}
        </Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {renderProfileHeader()}
            {renderPostsHeader()}
          </View>
        }
        ListEmptyComponent={!postsLoading ? renderEmptyPosts : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {postsLoading && (
        <View style={styles.postsLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    paddingTop: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: getResponsiveSpacing('md'),
  },
  backText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    marginTop: getResponsiveSpacing('sm'),
  },
  listContent: {
    padding: getResponsiveSpacing('md'),
  },
  profileHeader: {
    padding: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderRadius: 40,
  },
  avatarText: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  userMeta: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  userAge: {
    fontSize: getResponsiveFontSize('md'),
    marginBottom: 2,
  },
  userLocation: {
    fontSize: getResponsiveFontSize('md'),
  },
  userBio: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
    marginBottom: getResponsiveSpacing('sm'),
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
  },
  interest: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  interestText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: getResponsiveFontSize('sm'),
    fontStyle: 'italic',
  },
  profileActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: getResponsiveSpacing('md'),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  actionButton: {
    flex: 1,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  postsTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  createPostButton: {
    padding: getResponsiveSpacing('sm'),
  },
  createPostText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  emptyState: {
    padding: getResponsiveSpacing('xl'),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
  },
  emptyAction: {
    minWidth: 200,
  },
  postsLoading: {
    padding: getResponsiveSpacing('md'),
    alignItems: 'center',
  },
}); 