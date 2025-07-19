import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../types';
import { calculateAge } from '../../utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { Input } from './Input';
import { ListItem } from './ListItem';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onUserPress?: (userId: string) => void;
  onImagePress?: (imageUrl: string, index: number) => void;
  showComments?: boolean;
  isOwnPost?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onUserPress,
  onImagePress,
  showComments = true,
  isOwnPost = false,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleLikePress = () => {
    if (!currentUserId) return;
    
    if (post.liked_by_current_user) {
      onUnlike?.(post.id);
    } else {
      onLike?.(post.id);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentUserId || submittingComment) return;

    try {
      setSubmittingComment(true);
      await onComment?.(post.id, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString();
  };

  const renderUserHeader = () => (
    <TouchableOpacity
      style={styles.userHeader}
      onPress={() => onUserPress?.(post.user_id)}
      disabled={!onUserPress}
    >
      <View style={styles.avatarContainer}>
        {post.user_profile?.photos && post.user_profile.photos.length > 0 ? (
          <Image
            source={{ uri: post.user_profile.photos[0] }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.avatarText, { color: '#fff' }]}>
              {post.user_profile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {post.user_profile?.first_name} {post.user_profile?.last_name}
        </Text>
        <View style={styles.postMeta}>
          {post.user_profile?.birthdate && (
            <Text style={[styles.userAge, { color: theme.colors.textSecondary }]}>
              {calculateAge(post.user_profile.birthdate)} •{' '}
            </Text>
          )}
          <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
            {formatTimeAgo(post.created_at)}
          </Text>
          {post.location && (
            <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
              {' • '}{post.location}
            </Text>
          )}
        </View>
      </View>

      {isOwnPost && (onEdit || onDelete) && (
        <View style={styles.postActions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(post)}
            >
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(post.id)}
            >
              <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => (
    <View style={styles.content}>
      {post.content ? (
        <Text style={[styles.postText, { color: theme.colors.text }]}>
          {post.content}
        </Text>
      ) : null}
      
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.tagText, { color: '#fff' }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        {post.images.length === 1 ? (
          <TouchableOpacity
            onPress={() => onImagePress?.(post.images[0], 0)}
            disabled={!onImagePress}
          >
            <Image
              source={{ uri: post.images[0] }}
              style={styles.singleImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.multipleImages}>
            {post.images.slice(0, 4).map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.imageWrapper,
                  post.images.length === 2 && styles.twoImages,
                  post.images.length >= 3 && styles.multiImage,
                ]}
                onPress={() => onImagePress?.(imageUrl, index)}
                disabled={!onImagePress}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.multiImageItem}
                  contentFit="cover"
                />
                {index === 3 && post.images.length > 4 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>+{post.images.length - 4}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderInteractions = () => (
    <View style={styles.interactions}>
      <View style={styles.interactionButtons}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={handleLikePress}
          disabled={!currentUserId}
        >
          <Text style={[
            styles.interactionIcon,
            {
              color: post.liked_by_current_user ? theme.colors.heart : theme.colors.textSecondary
            }
          ]}>
            {post.liked_by_current_user ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.interactionText, { color: theme.colors.textSecondary }]}>
            {post.likes_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => setShowCommentInput(!showCommentInput)}
          disabled={!currentUserId}
        >
          <Text style={[styles.interactionIcon, { color: theme.colors.textSecondary }]}>
            💬
          </Text>
          <Text style={[styles.interactionText, { color: theme.colors.textSecondary }]}>
            {post.comments_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommentInput = () => {
    if (!showCommentInput || !currentUserId) return null;

    return (
      <View style={styles.commentInputContainer}>
        <Input
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Write a comment..."
          multiline
          style={styles.commentInput}
        />
        <Button
          title="Post"
          onPress={handleCommentSubmit}
          loading={submittingComment}
          disabled={!commentText.trim()}
          size="small"
          style={styles.commentButton}
        />
      </View>
    );
  };

  return (
    <ListItem style={styles.card}>
      {renderUserHeader()}
      {renderContent()}
      {renderImages()}
      {renderInteractions()}
      {showComments && renderCommentInput()}
    </ListItem>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: getResponsiveSpacing('md'),
    padding: 0,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('sm'),
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
    borderRadius: 20,
  },
  avatarText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAge: {
    fontSize: getResponsiveFontSize('sm'),
  },
  postTime: {
    fontSize: getResponsiveFontSize('sm'),
  },
  location: {
    fontSize: getResponsiveFontSize('sm'),
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: getResponsiveSpacing('sm'),
  },
  actionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  postText: {
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
    marginBottom: getResponsiveSpacing('sm'),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('xs'),
  },
  tag: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  tagText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  imagesContainer: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  singleImage: {
    width: '100%',
    height: 300,
  },
  multipleImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  imageWrapper: {
    position: 'relative',
  },
  twoImages: {
    width: '49.5%',
    height: 200,
  },
  multiImage: {
    width: '49.5%',
    height: 150,
  },
  multiImageItem: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  interactions: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  interactionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getResponsiveSpacing('lg'),
  },
  interactionIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('xs'),
  },
  interactionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('md'),
    gap: getResponsiveSpacing('sm'),
  },
  commentInput: {
    flex: 1,
    marginBottom: 0,
  },
  commentButton: {
    alignSelf: 'flex-end',
  },
}); 