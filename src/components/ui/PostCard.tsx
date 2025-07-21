import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Post, PostComment } from '../../types';
import { calculateAge } from '../../utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { EmojiGifPicker } from './EmojiGifPicker';
import { Input } from './Input';

const { width: screenWidth } = Dimensions.get('window');

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
  onReport?: (postId: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
}

interface MediaContent {
  type: 'gif' | 'sticker';
  url: string;
  title?: string;
}

interface ReactionData {
  comment_id: string;
  reaction_type: string;
  count?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onUserPress,
  onImagePress,
  showComments = false,
  isOwnPost = false,
  onEdit,
  onDelete,
  onReport,
  onEditComment,
}) => {
  const theme = useTheme();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeInput, setActiveInput] = useState<'comment' | 'reply' | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaContent | null>(null);
  const [replySelectedMedia, setReplySelectedMedia] = useState<MediaContent | null>(null);
  const [commentReactions, setCommentReactions] = useState<{ [commentId: string]: { likes: number; isLiked: boolean } }>({});
  const [emojiForComment, setEmojiForComment] = useState<string | null>(null);
  const [commentOptions, setCommentOptions] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    if (showCommentsSection) {
      loadComments();
    }
  }, [post.id, showCommentsSection]);

  const loadComments = async () => {
    if (!currentUserId) return;

    try {
      setLoadingComments(true);
      
      // First, get comments without user profile data
      const { data: postComments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      if (postComments) {
        // Process comments to include replies and user data
        const commentsWithReplies = await Promise.all(
          postComments.map(async (comment) => {
            // Get replies for this comment
            const { data: replies } = await supabase
              .from('post_comments')
              .select('*')
              .eq('parent_id', comment.id)
              .order('created_at', { ascending: true });

            // Get user profile data for the comment author
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', comment.user_id)
              .single();

            // Process replies to include user data
            const repliesWithUserData = await Promise.all(
              (replies || []).map(async (reply) => {
                const { data: replyUserProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', reply.user_id)
                  .single();

                return {
                  ...reply,
                  user_profile: replyUserProfile
                };
              })
            );

            return {
              ...comment,
              user_profile: userProfile,
              replies: repliesWithUserData
            };
          })
        );

        setComments(commentsWithReplies);

        // Load reactions if the table exists
        try {
        const commentIds = postComments.map(comment => comment.id);
        
        // Load reaction counts
        const { data: reactionCounts, error: countsError } = await supabase
          .rpc('get_comment_reaction_counts', { comment_ids: commentIds });
        
        // Load user reactions
        const { data: userReactions, error: userError } = await supabase
          .rpc('get_user_comment_reactions', { 
            comment_ids: commentIds, 
            user_uuid: currentUserId 
          });

        if (!countsError && !userError) {
          // Create reactions object
          const reactions: Record<string, { likes: number; isLiked: boolean }> = {};
          
          postComments.forEach(comment => {
            const likeCount = reactionCounts?.find((r: ReactionData) => 
              r.comment_id === comment.id && r.reaction_type === 'like'
            )?.count || 0;
            
            const userLiked = userReactions?.some((r: ReactionData) => 
              r.comment_id === comment.id && r.reaction_type === 'like'
            ) || false;
            
            reactions[comment.id] = {
              likes: Number(likeCount),
              isLiked: userLiked
            };
          });
          
          setCommentReactions(reactions);
          }
        } catch (reactionError) {
          // If comment_reactions table doesn't exist yet, just continue without reactions
          console.log('Comment reactions not available yet:', reactionError);
          setCommentReactions({});
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikePress = () => {
    if (!currentUserId) return;
    
    if (post.liked_by_current_user) {
      onUnlike?.(post.id);
    } else {
      onLike?.(post.id);
    }
  };

  const handleCommentButtonPress = () => {
    setShowCommentsSection(!showCommentsSection);
    if (!showCommentsSection) {
      setShowCommentInput(true);
    }
  };

  const handleCommentSubmit = async () => {
    if ((!commentText.trim() && !selectedMedia) || !currentUserId || submittingComment) return;

    try {
      setSubmittingComment(true);
      
      // Create the comment content with media
      let content = commentText.trim();
      if (selectedMedia) {
        const mediaTag = selectedMedia.type === 'gif' 
          ? `[GIF: ${selectedMedia.url}]`
          : `[STICKER: ${selectedMedia.url}]`;
        content = content ? `${content} ${mediaTag}` : mediaTag;
      }
      
      await onComment?.(post.id, content);
      setCommentText('');
      setSelectedMedia(null);
      await loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!currentUserId || (!replyText.trim() && !replySelectedMedia)) return;

    setSubmittingReply(true);
    try {
      // Create the reply content with media
      let content = replyText.trim();
      if (replySelectedMedia) {
        const mediaTag = replySelectedMedia.type === 'gif' 
          ? `[GIF: ${replySelectedMedia.url}]`
          : `[STICKER: ${replySelectedMedia.url}]`;
        content = content ? `${content} ${mediaTag}` : mediaTag;
      }
      
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: content || 'Media content',
          parent_id: commentId
        });

      if (error) {
        console.error('Error submitting reply:', error);
        return;
      }

      setReplyText('');
      setReplySelectedMedia(null);
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCommentReaction = async (commentId: string) => {
    if (!currentUserId) return;

    const currentReaction = commentReactions[commentId] || { likes: 0, isLiked: false };
    const newIsLiked = !currentReaction.isLiked;
    const newLikes = newIsLiked ? currentReaction.likes + 1 : currentReaction.likes - 1;

    // Optimistically update UI
    setCommentReactions(prev => ({
      ...prev,
      [commentId]: { likes: newLikes, isLiked: newIsLiked }
    }));

    try {
      if (newIsLiked) {
        // Add reaction
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
            reaction_type: 'like'
          });

        if (error) {
          console.error('Error adding reaction:', error);
          // Revert optimistic update
          setCommentReactions(prev => ({
            ...prev,
            [commentId]: { likes: currentReaction.likes, isLiked: currentReaction.isLiked }
          }));
        }
      } else {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId)
          .eq('reaction_type', 'like');

        if (error) {
          console.error('Error removing reaction:', error);
          // Revert optimistic update
          setCommentReactions(prev => ({
            ...prev,
            [commentId]: { likes: currentReaction.likes, isLiked: currentReaction.isLiked }
          }));
        }
      }
    } catch (error) {
      console.error('Error handling comment reaction:', error);
      // Revert optimistic update
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: { likes: currentReaction.likes, isLiked: currentReaction.isLiked }
      }));
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (activeInput === 'comment') {
      setCommentText(prev => prev + emoji);
    } else if (activeInput === 'reply') {
      setReplyText(prev => prev + emoji);
    } else if (emojiForComment && currentUserId) {
      // Add emoji as a reaction to the comment
      try {
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: emojiForComment,
            user_id: currentUserId,
            reaction_type: emoji
          });

        if (error) {
          console.error('Error adding emoji reaction:', error);
        } else {
          // Refresh comments to show the new reaction
          await loadComments();
        }
      } catch (error) {
        console.error('Error adding emoji reaction:', error);
      }
      
      // Close emoji picker and reset state
      setShowEmojiPicker(false);
      setEmojiForComment(null);
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    const mediaContent: MediaContent = {
      type: 'gif',
      url: gifUrl,
      title: 'GIF'
    };
    
    if (activeInput === 'comment') {
      setSelectedMedia(mediaContent);
    } else if (activeInput === 'reply') {
      setReplySelectedMedia(mediaContent);
    }
  };

  const handleStickerSelect = (stickerUrl: string) => {
    const mediaContent: MediaContent = {
      type: 'sticker',
      url: stickerUrl,
      title: 'Sticker'
    };
    
    if (activeInput === 'comment') {
      setSelectedMedia(mediaContent);
    } else if (activeInput === 'reply') {
      setReplySelectedMedia(mediaContent);
    }
  };

  const clearSelectedMedia = (type: 'comment' | 'reply') => {
    if (type === 'comment') {
      setSelectedMedia(null);
    } else {
      setReplySelectedMedia(null);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(post.id)
        }
      ]
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => onReport?.(post.id)
        }
      ]
    );
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUserId);

              if (error) {
                console.error('Error deleting comment:', error);
                Alert.alert('Error', 'Failed to delete comment. Please try again.');
              } else {
                await loadComments();
                setCommentOptions(null);
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReportComment = (commentId: string) => {
    Alert.alert(
      'Report Comment',
      'Are you sure you want to report this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement comment reporting
            Alert.alert('Reported', 'Comment has been reported.');
            setCommentOptions(null);
          }
        }
      ]
    );
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      // Remove media tags from content for editing
      const cleanContent = comment.content.replace(/\[GIF: .+?\]|\[STICKER: .+?\]/g, '').trim();
      setEditCommentText(cleanContent);
      setEditingComment(commentId);
      setCommentOptions(null);
    }
  };

  const handleEditCommentSubmit = async () => {
    if (!editingComment || !editCommentText.trim() || submittingEdit) return;

    try {
      setSubmittingEdit(true);
      
      // Call the parent handler
      onEditComment?.(editingComment, editCommentText.trim());
      
      // Update the comment locally
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === editingComment 
            ? { ...comment, content: editCommentText.trim() }
            : comment
        )
      );
      
      // Reset edit state
      setEditingComment(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
      Alert.alert('Error', 'Failed to edit comment. Please try again.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const renderFormattedText = (text: string) => {
    // Remove media tags first
    const cleanText = text.replace(/\[GIF: .+?\]|\[STICKER: .+?\]/g, '');
    
    // Split text into lines to detect lists
    const lines = cleanText.split('\n');
    const formattedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line is a list item (starts with -, *, +, or number.)
      const listItemMatch = trimmedLine.match(/^([-*+]|\d+\.)\s+(.+)$/);
      
      if (listItemMatch) {
        const [, marker, content] = listItemMatch;
        return (
          <View key={index} style={styles.listItemContainer}>
            <Text style={[styles.listMarker, { color: theme.colors.text }]}>
              {marker}
            </Text>
            <Text style={[styles.listItemText, { color: theme.colors.text }]}>
              {content}
            </Text>
          </View>
        );
      }
      
      // Regular text line (only render if not empty)
      if (line.trim()) {
        return (
          <Text key={index} style={[styles.commentText, { color: theme.colors.text }]}>
            {line}
          </Text>
        );
      }
      
      // Empty line - add spacing
      return <View key={index} style={styles.emptyLine} />;
    });
    
    return formattedLines;
  };

  const renderMediaPreview = (media: MediaContent, onRemove: () => void) => (
    <View style={styles.mediaPreviewContainer}>
      <Image
        source={{ uri: media.url }}
        style={styles.mediaPreview}
        contentFit="cover"
      />
      <TouchableOpacity style={styles.removeMediaButton} onPress={onRemove}>
        <MaterialIcons name="close" size={16} color="#fff" />
      </TouchableOpacity>
      <View style={styles.mediaTypeBadge}>
        <Text style={styles.mediaTypeText}>{media.type.toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderCommentMedia = (comment: PostComment) => {
    // Check if comment content contains GIF or sticker URLs
    const gifMatch = comment.content.match(/\[GIF: (.+?)\]/);
    const stickerMatch = comment.content.match(/\[STICKER: (.+?)\]/);
    
    if (gifMatch) {
      const mediaUrl = gifMatch[1];
      return (
        <View style={styles.commentMediaContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.commentMedia}
            contentFit="cover"
          />
          <View style={styles.commentMediaTypeBadge}>
            <Text style={styles.commentMediaTypeText}>GIF</Text>
          </View>
        </View>
      );
    }
    
    if (stickerMatch) {
      const mediaUrl = stickerMatch[1];
      return (
        <View style={styles.commentMediaContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.commentMedia}
            contentFit="cover"
          />
          <View style={styles.commentMediaTypeBadge}>
            <Text style={styles.commentMediaTypeText}>STICKER</Text>
          </View>
        </View>
      );
    }
    
    return null;
  };

  const renderUserHeader = () => (
    <View style={styles.userHeader}>
      <TouchableOpacity
        style={styles.userInfoContainer}
        onPress={() => onUserPress?.(post.user_id)}
        disabled={!onUserPress}
      >
        <View style={styles.avatarContainer}>
          {post.user_profile?.photos && post.user_profile.photos.length > 0 ? (
            <Image
              source={{ uri: post.user_profile.photos[0] }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons 
                name="person" 
                size={28} 
                color="#fff" 
              />
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {post.user_profile?.first_name && post.user_profile?.last_name 
                ? `${post.user_profile.first_name} ${post.user_profile.last_name}`
                : 'Anonymous User'
              }
            </Text>
            <View style={styles.userBadges}>
              {isOwnPost && (
                <View style={[styles.ownPostBadge, { backgroundColor: theme.colors.primary }]}>
                  <MaterialIcons 
                    name="check" 
                    size={12} 
                    color="#fff" 
                  />
                  <Text style={styles.ownPostText}>You</Text>
                </View>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: '#1da1f2' }]}>
                <MaterialIcons 
                  name="verified" 
                  size={14} 
                  color="#fff" 
                />
              </View>
            </View>
          </View>
          <View style={styles.postMeta}>
            <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
              {formatTimeAgo(post.created_at)}
            </Text>
            {post.location && (
              <View style={styles.locationContainer}>
                <MaterialIcons 
                  name="location-on" 
                  size={12} 
                  color={theme.colors.textSecondary}
                  style={styles.locationIcon}
                />
                <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
                  {post.location}
                </Text>
              </View>
            )}
            {post.user_profile?.birthdate && (
              <Text style={[styles.userAge, { color: theme.colors.textSecondary }]}>
                • {calculateAge(post.user_profile.birthdate)} years old
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <MaterialIcons 
          name="more-horiz" 
          size={24} 
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const getOptionsCount = () => {
    let count = 0;
    if (isOwnPost && onEdit) count++;
    if (isOwnPost && onDelete) count++;
    if (!isOwnPost && onReport) count++;
    if (!isOwnPost && onUserPress) count++;
    return count;
  };

  const renderOptionsMenu = () => {
    if (!showOptions) return null;

    const optionsCount = getOptionsCount();
    if (optionsCount === 0) return null;

    return (
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={[
          styles.optionsMenu,
          { 
            minHeight: optionsCount * 44 + getResponsiveSpacing('sm') * 2,
            maxHeight: optionsCount * 44 + getResponsiveSpacing('sm') * 2
          }
        ]}>
        {isOwnPost && onEdit && (
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              setShowOptions(false);
              onEdit(post);
            }}
          >
            <MaterialIcons 
              name="edit" 
              size={20} 
              color={theme.colors.primary}
            />
            <Text style={[styles.optionText, { color: theme.colors.primary }]}>
              Edit Post
            </Text>
          </TouchableOpacity>
        )}
        
        {isOwnPost && onDelete && (
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleDeletePost}
          >
            <MaterialIcons 
              name="delete" 
              size={20} 
              color={theme.colors.error}
            />
            <Text style={[styles.optionText, { color: theme.colors.error }]}>
              Delete Post
            </Text>
          </TouchableOpacity>
        )}
        
        {!isOwnPost && onReport && (
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleReportPost}
          >
            <MaterialIcons 
              name="report" 
              size={20} 
              color={theme.colors.error}
            />
            <Text style={[styles.optionText, { color: theme.colors.error }]}>
              Report Post
            </Text>
          </TouchableOpacity>
        )}
          
          {!isOwnPost && onUserPress && (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                onUserPress(post.user_id);
              }}
            >
              <MaterialIcons 
                name="person" 
                size={20} 
                color={theme.colors.primary}
              />
              <Text style={[styles.optionText, { color: theme.colors.primary }]}>
                Visit Profile
              </Text>
            </TouchableOpacity>
          )}
      </View>
      </TouchableWithoutFeedback>
    );
  };

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
            <TouchableOpacity key={index} style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.tagText, { color: '#fff' }]}>#{tag}</Text>
            </TouchableOpacity>
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

  const renderStats = () => (
    <View style={styles.statsContainer}>
      {post.likes_count > 0 && (
        <View style={styles.statItem}>
          <View style={styles.likeIconContainer}>
            <MaterialIcons 
              name="favorite" 
              size={16} 
              color="#fff" 
            />
          </View>
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {post.likes_count}
          </Text>
        </View>
      )}
      {post.comments_count > 0 && (
        <TouchableOpacity onPress={() => setShowCommentsSection(!showCommentsSection)}>
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, post.liked_by_current_user && styles.actionButtonActive]}
        onPress={handleLikePress}
        disabled={!currentUserId}
      >
        <MaterialIcons 
          name={post.liked_by_current_user ? "favorite" : "favorite-border"} 
          size={20} 
          color={post.liked_by_current_user ? theme.colors.heart : theme.colors.textSecondary}
        />
        <Text style={[
          styles.actionButtonText, 
          { 
            color: post.liked_by_current_user ? theme.colors.heart : theme.colors.textSecondary 
          }
        ]}>
          Like
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleCommentButtonPress}
        disabled={!currentUserId}
      >
        <MaterialIcons 
          name="chat-bubble-outline" 
          size={20} 
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
          Comment
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <MaterialIcons 
          name="more-horiz" 
          size={20} 
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>
          Options
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCommentReactions = (comment: PostComment) => {
    // This would show emoji reactions for the comment
    // For now, we'll just show the like count
    const reaction = commentReactions[comment.id];
    if (!reaction || reaction.likes === 0) return null;
    
    return (
      <View style={styles.commentReactionsContainer}>
        <Text style={[styles.commentReactionsText, { color: theme.colors.textSecondary }]}>
          {reaction.likes} {reaction.likes === 1 ? 'reaction' : 'reactions'}
        </Text>
      </View>
    );
  };

  const renderComment = (comment: PostComment) => {
    const isReplying = replyingTo === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const currentReaction = commentReactions[comment.id] || { likes: 0, isLiked: false };

    return (
      <View key={comment.id} style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          {comment.user_profile?.photos && comment.user_profile.photos.length > 0 ? (
            <Image
              source={{ uri: comment.user_profile.photos[0] }}
              style={styles.commentAvatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.commentAvatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons 
                name="person" 
                size={16} 
                color="#fff" 
              />
            </View>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentUserName, { color: theme.colors.text }]}>
              {comment.user_profile?.first_name && comment.user_profile?.last_name 
                ? `${comment.user_profile.first_name} ${comment.user_profile.last_name}`
                : 'Anonymous User'
              }
            </Text>
            <View style={styles.commentHeaderRight}>
              <Text style={[styles.commentTime, { color: '#666' }]}>
                {formatTimeAgo(comment.created_at)}
              </Text>
              <TouchableOpacity
                style={styles.commentOptionsButton}
                onPress={() => setCommentOptions(commentOptions === comment.id ? null : comment.id)}
              >
                <MaterialIcons 
                  name="more-vert" 
                  size={16} 
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          {editingComment === comment.id ? (
            <View style={styles.editCommentContainer}>
              <Input
                value={editCommentText}
                onChangeText={setEditCommentText}
                placeholder="Edit your comment..."
                multiline
                style={styles.editCommentInput}
              />
              <View style={styles.editCommentActions}>
                <TouchableOpacity
                  style={[styles.editCommentButton, (!editCommentText.trim()) && styles.editCommentButtonDisabled]}
                  onPress={handleEditCommentSubmit}
                  disabled={!editCommentText.trim() || submittingEdit}
                >
                  <Text style={[
                    styles.editCommentButtonText, 
                    { color: editCommentText.trim() ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    {submittingEdit ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={[styles.cancelEditText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
          {renderFormattedText(comment.content)}
          {renderCommentMedia(comment)}
            </>
          )}
          {renderCommentReactions(comment)}
          
          {/* Comment actions */}
          <View style={styles.commentActions}>
            {currentUserId && (
              <>
                <TouchableOpacity
                  style={[styles.commentActionButton, commentReactions[comment.id]?.isLiked && styles.commentActionButtonPressed]}
                  onPress={() => handleCommentReaction(comment.id)}
                >
                  <MaterialIcons 
                    name={commentReactions[comment.id]?.isLiked ? "favorite" : "favorite-border"} 
                    size={16} 
                    color={commentReactions[comment.id]?.isLiked ? theme.colors.error : theme.colors.textSecondary} 
                    style={styles.commentActionIcon}
                  />
                  <Text style={[
                    styles.commentActionText, 
                    { 
                      color: commentReactions[comment.id]?.isLiked ? theme.colors.error : theme.colors.textSecondary,
                      marginLeft: getResponsiveSpacing('xs')
                    }
                  ]}>
                    {commentReactions[comment.id]?.likes > 0 ? commentReactions[comment.id].likes : ''} React
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.commentActionButton}
                  onPress={() => {
                    setEmojiForComment(comment.id);
                    setShowEmojiPicker(true);
                  }}
                >
                  <MaterialIcons 
                    name="emoji-emotions" 
                    size={16} 
                    color={theme.colors.primary}
                    style={styles.commentActionIcon}
                  />
                  <Text style={[styles.commentActionText, { color: theme.colors.primary }]}>
                    Emoji
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.commentActionButton, isReplying && styles.commentActionButtonPressed]}
                  onPress={() => setReplyingTo(isReplying ? null : comment.id)}
                >
                  <MaterialIcons 
                    name="reply" 
                    size={16} 
                    color={theme.colors.primary}
                    style={styles.commentActionIcon}
                  />
                  <Text style={[styles.commentActionText, { color: theme.colors.primary }]}>
                    Reply
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Reply input */}
          {isReplying && (
            <View style={styles.replyInputContainer}>
              {replySelectedMedia && renderMediaPreview(replySelectedMedia, () => clearSelectedMedia('reply'))}
              <Input
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Reply to ${comment.user_profile?.first_name || 'User'}...`}
                multiline
                style={styles.replyInput}
              />
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => {
                    setActiveInput('reply');
                    setShowEmojiPicker(true);
                  }}
                >
                  <MaterialIcons name="emoji-emotions" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.replyButton, (!replyText.trim() && !replySelectedMedia) && styles.replyButtonDisabled]}
                  onPress={() => handleReplySubmit(comment.id)}
                  disabled={(!replyText.trim() && !replySelectedMedia) || submittingReply}
                >
                  <Text style={[
                    styles.replyButtonText, 
                    { color: (replyText.trim() || replySelectedMedia) ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    Reply
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelReplyButton}
                  onPress={() => {
                    setReplyingTo(null);
                    setReplyText('');
                    setReplySelectedMedia(null);
                  }}
                >
                  <Text style={[styles.cancelReplyText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Show replies */}
          {hasReplies && (
            <View style={styles.repliesContainer}>
              {comment.replies!.map((reply) => renderComment(reply))}
            </View>
          )}
        </View>
        {renderCommentOptionsMenu(comment)}
      </View>
    );
  };

  const renderComments = () => {
    if (!showCommentsSection) return null;

    return (
      <View style={styles.commentsContainer}>
        {loadingComments ? (
          <View style={styles.loadingComments}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading comments...
            </Text>
          </View>
        ) : (
          <View style={styles.commentsList}>
            {comments.map((comment) => renderComment(comment))}
            
            {comments.length === 0 && (
              <View style={styles.noComments}>
                <Text style={[styles.noCommentsText, { color: theme.colors.textSecondary }]}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCommentInput = () => {
    if (!showCommentInput || !currentUserId) return null;

    return (
      <View style={styles.commentInputContainer}>
        {selectedMedia && renderMediaPreview(selectedMedia, () => clearSelectedMedia('comment'))}
        <View style={styles.commentInputWrapper}>
          <Input
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            multiline
            style={styles.commentInput}
          />
          <View style={styles.commentInputActions}>
            <TouchableOpacity
              style={styles.emojiButton}
              onPress={() => {
                setActiveInput('comment');
                setShowEmojiPicker(true);
              }}
            >
              <MaterialIcons name="emoji-emotions" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.postCommentButton, (!commentText.trim() && !selectedMedia) && styles.postCommentButtonDisabled]}
              onPress={handleCommentSubmit}
              disabled={(!commentText.trim() && !selectedMedia) || submittingComment}
            >
              <Text style={[
                styles.postCommentButtonText, 
                { color: (commentText.trim() || selectedMedia) ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getCommentOptionsCount = (comment: PostComment) => {
    const isOwnComment = comment.user_id === currentUserId;
    let count = 0;
    if (isOwnComment) count += 2; // Edit + Delete
    if (!isOwnComment) count++; // Report
    if (!isOwnComment && onUserPress) count++; // Visit Profile
    return count;
  };

  const renderCommentOptionsMenu = (comment: PostComment) => {
    if (commentOptions !== comment.id) return null;

    const isOwnComment = comment.user_id === currentUserId;
    const optionsCount = getCommentOptionsCount(comment);
    
    if (optionsCount === 0) return null;

    return (
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={[
          styles.commentOptionsMenu,
          { 
            minHeight: optionsCount * 40 + getResponsiveSpacing('xs') * 2,
            maxHeight: optionsCount * 40 + getResponsiveSpacing('xs') * 2
          }
        ]}>
        {isOwnComment && (
            <>
              <TouchableOpacity
                style={styles.commentOptionItem}
                onPress={() => handleEditComment(comment.id)}
              >
                <MaterialIcons 
                  name="edit" 
                  size={16} 
                  color={theme.colors.primary}
                />
                <Text style={[styles.commentOptionText, { color: theme.colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              
          <TouchableOpacity
            style={styles.commentOptionItem}
            onPress={() => handleDeleteComment(comment.id)}
          >
            <MaterialIcons 
              name="delete" 
              size={16} 
              color={theme.colors.error}
            />
            <Text style={[styles.commentOptionText, { color: theme.colors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
            </>
        )}
        
        {!isOwnComment && (
          <TouchableOpacity
            style={styles.commentOptionItem}
            onPress={() => handleReportComment(comment.id)}
          >
            <MaterialIcons 
              name="report" 
              size={16} 
              color={theme.colors.error}
            />
            <Text style={[styles.commentOptionText, { color: theme.colors.error }]}>
              Report
            </Text>
          </TouchableOpacity>
        )}
          
          {!isOwnComment && onUserPress && (
            <TouchableOpacity
              style={styles.commentOptionItem}
              onPress={() => {
                setCommentOptions(null);
                onUserPress(comment.user_id);
              }}
            >
              <MaterialIcons 
                name="person" 
                size={16} 
                color={theme.colors.primary}
              />
              <Text style={[styles.commentOptionText, { color: theme.colors.primary }]}>
                Visit Profile
              </Text>
            </TouchableOpacity>
          )}
      </View>
      </TouchableWithoutFeedback>
    );
  };

  const handleCardPress = () => {
    // Close post options menu
    setShowOptions(false);
    // Close comment options menu
    setCommentOptions(null);
  };

  return (
    <TouchableWithoutFeedback onPress={handleCardPress}>
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {renderUserHeader()}
      {renderOptionsMenu()}
      {renderContent()}
      {renderImages()}
      {renderStats()}
      {renderActionButtons()}
      {renderComments()}
      {renderCommentInput()}
      
      <EmojiGifPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onStickerSelect={handleStickerSelect}
      />
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: getResponsiveSpacing('md'),
    padding: 0,
    borderRadius: getResponsiveSpacing('md'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing('lg'),
    paddingBottom: getResponsiveSpacing('md'),
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('md'),
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: getResponsiveSpacing('sm'),
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: getResponsiveSpacing('xs'),
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSpacing('xs'),
  },
  ownPostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: 2,
    borderRadius: getResponsiveSpacing('xs'),
    marginLeft: getResponsiveSpacing('xs'),
  },
  ownPostText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: getResponsiveSpacing('sm'),
  },
  locationIcon: {
    marginRight: getResponsiveSpacing('xs'),
  },
  location: {
    fontSize: getResponsiveFontSize('sm'),
  },
  optionsButton: {
    padding: getResponsiveSpacing('sm'),
  },
  optionsMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('sm'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
    minWidth: 120,
    maxWidth: 200,
    flexDirection: 'column',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    minHeight: 44,
    justifyContent: 'flex-start',
  },
  optionText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
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
  commentsContainer: {
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingTop: getResponsiveSpacing('xs'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  loadingComments: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  commentsList: {
    // No specific styles for comments list, it will be handled by individual comment items
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('sm'),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentOptionsButton: {
    padding: getResponsiveSpacing('xs'),
  },
  commentUserName: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    flex: 1,
    color: '#1a1a1a',
  },
  commentTime: {
    fontSize: getResponsiveFontSize('xs'),
    color: '#666',
    marginLeft: getResponsiveSpacing('xs'),
  },
  commentText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
    color: '#333',
    marginBottom: getResponsiveSpacing('xs'),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('sm'),
    gap: getResponsiveSpacing('md'),
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xs'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('md'),
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    minHeight: 32,
  },
  commentActionButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  commentActionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('xs'),
  },
  commentActionIcon: {
    marginRight: getResponsiveSpacing('xs'),
  },
  replyInputContainer: {
    marginTop: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
    backgroundColor: '#f0f2f5',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: getResponsiveSpacing('sm'),
  },
  replyButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  replyButtonDisabled: {
    opacity: 0.5,
  },
  replyButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  cancelReplyButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  cancelReplyText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: getResponsiveSpacing('sm'),
  },
  viewMoreComments: {
    alignSelf: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
  viewMoreText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  interactionsContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSpacing('xs'),
  },
  statText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getResponsiveSpacing('sm'),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('xs'),
  },
  commentInputContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveSpacing('sm'),
  },
  commentInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
  },
  emojiButton: {
    padding: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
    backgroundColor: '#f0f2f5',
  },
  postCommentButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  postCommentButtonDisabled: {
    opacity: 0.5,
  },
  postCommentButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'),
  },
  noCommentsText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  mediaPreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  mediaTypeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: 'bold',
  },
  commentMediaContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  commentMedia: {
    width: '100%',
    height: '100%',
  },
  commentMediaTypeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  commentMediaTypeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: 'bold',
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing('xs'),
  },
  listMarker: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    marginRight: getResponsiveSpacing('xs'),
  },
  listItemText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.3,
  },
  emptyLine: {
    height: getResponsiveSpacing('xs'),
  },
  commentReactionsContainer: {
    marginTop: getResponsiveSpacing('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  commentReactionsText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  commentOptionsMenu: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('xs'),
    marginTop: getResponsiveSpacing('xs'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 100,
    maxWidth: 180,
    flexDirection: 'column',
    alignSelf: 'flex-end',
  },
  commentOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('xs'),
    minHeight: 40,
    justifyContent: 'flex-start',
  },
  commentOptionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('sm'),
  },
  editCommentContainer: {
    marginTop: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('sm'),
    backgroundColor: '#f8f9fa',
    borderRadius: getResponsiveSpacing('sm'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editCommentInput: {
    minHeight: 40,
    borderRadius: getResponsiveSpacing('sm'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
    backgroundColor: '#fff',
    marginBottom: getResponsiveSpacing('sm'),
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: getResponsiveSpacing('sm'),
  },
  editCommentButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: '#e3f2fd',
  },
  editCommentButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  editCommentButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  cancelEditButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  cancelEditText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
}); 