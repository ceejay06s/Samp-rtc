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
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function UserPostsScreen() {
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
      console.error('Error refreshing posts:', error);
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
          Loading posts...
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
          {isOwnProfile ? 'My Posts' : `${profile?.first_name || 'User'}'s Posts`}
        </Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
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
}); 