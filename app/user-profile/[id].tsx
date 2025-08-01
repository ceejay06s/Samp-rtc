import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { CreatePost } from '../../src/components/ui/CreatePost';
import { ListItem } from '../../src/components/ui/ListItem';
import { PostCard } from '../../src/components/ui/PostCard';
import { WebAlert } from '../../src/components/ui/WebAlert';
import { usePlatform } from '../../src/hooks/usePlatform';
import { AuthService } from '../../src/services/auth';
import { CreatePostData, PostService } from '../../src/services/postService';
import { Post, Profile } from '../../src/types';
import { formatLocationForDisplay } from '../../src/utils/location';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../src/utils/responsive';
import { useTheme } from '../../src/utils/themes';

// Helper function to generate consistent random color based on user ID
const generateRandomColor = (userId: string): string => {
  // Create a simple hash from the user ID to ensure consistent colors
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to generate consistent colors
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default function UserProfileScreen() {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchLevel, setMatchLevel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'gallery' | 'info'>('posts');

  const isOwnProfile = currentUser?.id === userId;

  // Helper function to show alerts
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
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
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadProfile(), loadPosts()]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
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
      if (!currentUser?.id) {
        showAlert('Error', 'You must be logged in to comment.');
        return;
      }

      await PostService.addComment(postId, currentUser.id, content);
      // Refresh posts to get updated comment count
      await loadPosts();
    } catch (error) {
      console.error('Error commenting on post:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to add comment.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      if (!currentUser?.id) {
        showAlert('Error', 'You must be logged in to delete posts.');
        return;
      }

      showAlert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await PostService.deletePost(postId, currentUser.id);
              setPosts(prev => prev.filter(post => post.id !== postId));
              showAlert('Success', 'Post deleted successfully.');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting post:', error);
      showAlert('Error', 'Failed to delete post.');
    }
  };

  const handleEditPost = async (post: Post) => {
    // Navigate to edit post screen
    router.push(`/edit-post?postId=${post.id}`);
  };

  const handleReportPost = async (postId: string) => {
    showAlert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement post reporting functionality
            showAlert('Reported', 'Post has been reported. Thank you for helping keep our community safe.');
          },
        },
      ]
    );
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      if (!currentUser?.id) {
        showAlert('Error', 'You must be logged in to edit comments.');
        return;
      }

      await PostService.editComment(commentId, content, currentUser.id);
      showAlert('Success', 'Comment updated successfully!');
    } catch (error) {
      console.error('Error editing comment:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to edit comment.');
    }
  };

  const handleUserPress = (userId: string) => {
    // Navigate to the user's profile
    router.push(`/user-profile/${userId}`);
  };

  const handleImagePress = (imageUrl: string, index: number) => {
    // TODO: Implement full-screen image viewer
    console.log('Image pressed:', imageUrl, index);
  };

  const handleMessagePress = () => {
    if (!isMatched) {
      showAlert('Not Matched', 'You need to match with this user before you can message them.');
      return;
    }
    
    // Navigate to chat
    router.push(`/chat/${userId}`);
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
        <View style={styles.profileHeader}>
          <View style={styles.bannerContainer}>
            <View style={[styles.bannerPlaceholder, { backgroundColor: generateRandomColor(userId) }]}>
              <Text style={[styles.bannerText, { color: '#fff' }]}>No Banner</Text>
            </View>
          </View>
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
        </View>
      );
    }

    const bannerUrl = profile.photos && profile.photos.length > 1 ? profile.photos[1] : null;
    const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
    const displayName = profile.first_name || 'User';
    const displayLastName = profile.last_name || '';
    const fullName = `${displayName} ${displayLastName}`.trim() || 'User';

    return (
      <View style={styles.profileHeader}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {bannerUrl ? (
            <Image
              source={{ uri: bannerUrl }}
              style={styles.banner}
              contentFit="cover"
              placeholder="Loading..."
              placeholderContentFit="cover"
            />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: generateRandomColor(userId) }]}>
              <Text style={[styles.bannerText, { color: '#fff' }]}>No Banner</Text>
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                placeholder="Loading..."
                placeholderContentFit="cover"
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
                  📍 {formatLocationForDisplay(profile.location, 'city-state')}
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

            {isMatched && matchLevel && (
              <View style={[styles.matchStatusContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.matchStatusText, { color: theme.colors.primary }]}>
                  🎉 Matched! Level {matchLevel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
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
                title={isMatched ? 'Message' : 'Message'}
                onPress={handleMessagePress}
                style={styles.actionButton}
                disabled={!isMatched}
              />
              <Button
                title={isMatched ? 'Matched' : 'Like'}
                onPress={() => {
                  if (isMatched) {
                    showAlert('Already Matched', `You are already matched with ${profile.first_name}! You can message them.`);
                  } else {
                    showAlert('Coming Soon', 'Like feature will be available soon!');
                  }
                }}
                variant={isMatched ? 'primary' : 'accent'}
                style={styles.actionButton}
                disabled={isMatched}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
        onPress={() => setActiveTab('posts')}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'posts' ? theme.colors.primary : theme.colors.textSecondary }
        ]}>
          Posts
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
        onPress={() => setActiveTab('gallery')}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'gallery' ? theme.colors.primary : theme.colors.textSecondary }
        ]}>
          Gallery
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'info' && styles.activeTab]}
        onPress={() => setActiveTab('info')}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'info' ? theme.colors.primary : theme.colors.textSecondary }
        ]}>
          Info
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <View style={{ paddingHorizontal: getResponsiveSpacing('md') }}>
            <View style={styles.postsHeader}>
              <Text style={[styles.postsTitle, { color: theme.colors.text }]}>
                {isOwnProfile ? 'Your Posts' : 'Posts'} ({posts.length})
              </Text>
              
              {isOwnProfile && (
                <TouchableOpacity
                  style={styles.createPostButton}
                  onPress={() => router.push(`/user-posts?userId=${userId}`)}
                >
                  <Text style={[styles.createPostText, { color: theme.colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Show only first 3 posts */}
            {posts.slice(0, 3).map((post) => renderPost({ item: post }))}
            
            {posts.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => router.push(`/user-posts?userId=${userId}`)}
              >
                <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
                  View {posts.length - 3} more posts
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'gallery':
        return (
          <View style={styles.galleryContainer}>
            <Text style={[styles.galleryTitle, { color: theme.colors.text }]}>
              Photo Gallery
            </Text>
            {profile?.photos && profile.photos.length > 0 ? (
              <View style={styles.galleryGrid}>
                {profile.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.galleryItem}
                    onPress={() => handleImagePress(photo, index)}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.galleryImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.noPhotosText, { color: theme.colors.textSecondary }]}>
                No photos available
              </Text>
            )}
          </View>
        );
      
      case 'info':
        return (
          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Profile Information
            </Text>
            
            {profile?.bio && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoSectionTitle, { color: theme.colors.text }]}>
                  Bio
                </Text>
                <Text style={[styles.infoSectionContent, { color: theme.colors.text }]}>
                  {profile.bio}
                </Text>
              </View>
            )}
            
            {profile?.interests && profile.interests.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoSectionTitle, { color: theme.colors.text }]}>
                  Interests
                </Text>
                <View style={styles.interestsGrid}>
                  {profile.interests.map((interest, index) => (
                    <View key={index} style={[styles.interestChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.interestChipText, { color: theme.colors.text }]}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.infoSection}>
              <Text style={[styles.infoSectionTitle, { color: theme.colors.text }]}>
                Details
              </Text>
              {profile?.birthdate && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Age:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {calculateAge(profile.birthdate)} years old
                  </Text>
                </View>
              )}
              {profile?.location && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Location:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {formatLocationForDisplay(profile.location, 'city-state')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={currentUser?.id}
      onLike={handleLikePost}
      onUnlike={handleUnlikePost}
      onComment={handleCommentPost}
      onImagePress={handleImagePress}
      isOwnPost={isOwnProfile}
      onEdit={handleEditPost}
      onDelete={handleDeletePost}
      onReport={handleReportPost}
      onUserPress={handleUserPress}
      onEditComment={handleEditComment}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderTabs()}
        {renderTabContent()}
      </ScrollView>

      {postsLoading && (
        <View style={styles.postsLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {isOwnProfile && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreatePost(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
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
  scrollContent: {
    padding: 0, // Remove padding to make banner full width
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    marginBottom: 0, // Remove margin to make it flush
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: getResponsiveSpacing('md'), // Add horizontal padding for tabs
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('md'),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  galleryContainer: {
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'), // Add horizontal padding for gallery
  },
  galleryTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  galleryItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: getResponsiveSpacing('sm'),
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  noPhotosText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  infoContainer: {
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'), // Add horizontal padding for info
  },
  infoTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  infoSection: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  infoSectionTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  infoSectionContent: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  interestChip: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('lg'),
  },
  interestChipText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xs'),
  },
  detailLabel: {
    fontSize: getResponsiveFontSize('md'),
  },
  detailValue: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    marginTop: getResponsiveSpacing('md'),
  },
  viewMoreText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  profileHeader: {
    padding: 0, // Remove padding to make banner full width
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -50,
    marginBottom: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'), // Add horizontal padding for user details
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
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
    borderRadius: 50,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  userAge: {
    fontSize: getResponsiveFontSize('md'),
    marginRight: getResponsiveSpacing('md'),
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
    marginBottom: getResponsiveSpacing('sm'),
  },
  interest: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('lg'),
    marginRight: getResponsiveSpacing('xs'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  interestText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: getResponsiveFontSize('sm'),
    fontStyle: 'italic',
  },
  matchStatusContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('lg'),
    alignSelf: 'flex-start',
  },
  matchStatusText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  profileActions: {
    marginTop: getResponsiveSpacing('md'),
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
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
  },
  createPostText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
  },
  emptyAction: {
    marginTop: getResponsiveSpacing('md'),
  },
  postsLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -10,
  },
  fab: {
    position: 'absolute',
    bottom: getResponsiveSpacing('lg'),
    right: getResponsiveSpacing('lg'),
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    marginTop: getResponsiveSpacing('sm'),
  },
}); 