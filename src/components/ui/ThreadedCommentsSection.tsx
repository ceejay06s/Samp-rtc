import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PostService } from '../../services/postService';
import { Post, PostComment } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { Input } from './Input';

interface ThreadedCommentsSectionProps {
  post: Post;
  currentUserId?: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export const ThreadedCommentsSection: React.FC<ThreadedCommentsSectionProps> = ({
  post,
  currentUserId,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const theme = useTheme();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const postComments = await PostService.getPostComments(post.id);
      setComments(postComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUserId || submittingComment) return;

    try {
      setSubmittingComment(true);
      await PostService.addComment(post.id, currentUserId, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim() || !currentUserId || submittingComment) return;

    try {
      setSubmittingComment(true);
      await PostService.addReply(commentId, currentUserId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      await PostService.deleteComment(commentId, currentUserId);
      await loadComments();
      onCommentDeleted?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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
    // Split text into lines to detect lists
    const lines = text.split('\n');
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

  const renderComment = ({ item: comment, index }: { item: PostComment; index: number }) => {
    const isOwnComment = currentUserId === comment.user_id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isReplying = replyingTo === comment.id;

    return (
      <View style={styles.commentContainer}>
        {/* Comment content */}
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <MaterialIcons 
              name="person" 
              size={16} 
              color={theme.colors.primary}
              style={styles.userIcon}
            />
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {comment.user_profile?.first_name || 'User'}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
              {formatTimeAgo(comment.created_at)}
            </Text>
          </View>
          
          <View style={styles.commentTextContainer}>
            {renderFormattedText(comment.content)}
          </View>

          {/* Action buttons */}
          <View style={styles.commentActions}>
            {currentUserId && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setReplyingTo(isReplying ? null : comment.id)}
              >
                <MaterialIcons 
                  name="reply" 
                  size={14} 
                  color={theme.colors.primary}
                />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                  Reply
                </Text>
              </TouchableOpacity>
            )}
            
            {isOwnComment && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteComment(comment.id)}
              >
                <MaterialIcons 
                  name="delete" 
                  size={14} 
                  color={theme.colors.error}
                />
                <Text style={[styles.actionText, { color: theme.colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reply input */}
          {isReplying && (
            <View style={styles.replyInputContainer}>
              <Input
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                multiline
                style={styles.replyInput}
              />
              <View style={styles.replyActions}>
                <Button
                  title="Reply"
                  onPress={() => handleAddReply(comment.id)}
                  loading={submittingComment}
                  disabled={!replyText.trim()}
                  size="small"
                  style={styles.replyButton}
                />
                <Button
                  title="Cancel"
                  onPress={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  variant="outline"
                  size="small"
                  style={styles.cancelButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* Replies */}
        {hasReplies && (
          <View style={styles.repliesContainer}>
            {comment.replies!.map((reply) => (
              <View key={reply.id} style={styles.replyContainer}>
                <View style={styles.replyContent}>
                  <View style={styles.replyHeader}>
                    <MaterialIcons 
                      name="person" 
                      size={14} 
                      color={theme.colors.primary}
                      style={styles.userIcon}
                    />
                    <Text style={[styles.replyUserName, { color: theme.colors.text }]}>
                      {reply.user_profile?.first_name || 'User'}
                    </Text>
                    <Text style={[styles.replyTimestamp, { color: theme.colors.textSecondary }]}>
                      {formatTimeAgo(reply.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.replyTextContainer}>
                    {renderFormattedText(reply.content)}
                  </View>

                  {/* Reply actions - show reply button for replies to main comments */}
                  <View style={styles.replyActions}>
                    {currentUserId && (
                      <TouchableOpacity
                        style={styles.replyActionButton}
                        onPress={() => handleAddReply(reply.id)}
                      >
                        <MaterialIcons 
                          name="reply" 
                          size={12} 
                          color={theme.colors.primary}
                        />
                        <Text style={[styles.replyActionText, { color: theme.colors.primary }]}>
                          Reply
                        </Text>
                      </TouchableOpacity>
                    )}
                    {currentUserId === reply.user_id && (
                      <TouchableOpacity
                        style={styles.replyActionButton}
                        onPress={() => handleDeleteComment(reply.id)}
                      >
                        <MaterialIcons 
                          name="delete" 
                          size={12} 
                          color={theme.colors.error}
                        />
                        <Text style={[styles.replyActionText, { color: theme.colors.error }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Comments count header */}
      <View style={styles.header}>
        <MaterialIcons 
          name="chat" 
          size={20} 
          color={theme.colors.primary}
        />
        <Text style={[styles.commentsCount, { color: theme.colors.text }]}>
          {post.comments_count || 0} Comments
        </Text>
      </View>

      {/* Add comment button */}
      {currentUserId && !showCommentInput && (
        <TouchableOpacity
          style={styles.addCommentButton}
          onPress={() => setShowCommentInput(true)}
        >
          <MaterialIcons 
            name="add-comment" 
            size={16} 
            color={theme.colors.primary}
          />
          <Text style={[styles.addCommentText, { color: theme.colors.primary }]}>
            Add a comment...
          </Text>
        </TouchableOpacity>
      )}

      {/* Comment input */}
      {showCommentInput && currentUserId && (
        <View style={styles.commentInputContainer}>
          <Input
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            multiline
            style={styles.commentInput}
          />
          <View style={styles.commentInputActions}>
            <Button
              title="Post"
              onPress={handleAddComment}
              loading={submittingComment}
              disabled={!commentText.trim()}
              size="small"
              style={styles.postButton}
            />
            <Button
              title="Cancel"
              onPress={() => {
                setShowCommentInput(false);
                setCommentText('');
              }}
              variant="outline"
              size="small"
              style={styles.cancelButton}
            />
          </View>
        </View>
      )}

      {/* Comments list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading comments...
          </Text>
        </View>
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name="chat-bubble-outline" 
            size={48} 
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No comments yet. Be the first to comment!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: getResponsiveSpacing('md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  commentsCount: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginLeft: getResponsiveSpacing('sm'),
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('md'),
  },
  addCommentText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  commentInputContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  commentInput: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  commentInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postButton: {
    marginRight: getResponsiveSpacing('sm'),
  },
  cancelButton: {
    marginRight: getResponsiveSpacing('sm'),
  },
  loadingContainer: {
    alignItems: 'center',
    padding: getResponsiveSpacing('lg'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('sm'),
  },
  commentsList: {
    maxHeight: 400,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: getResponsiveSpacing('lg'),
  },
  emptyText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
  commentContainer: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  commentContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('sm'),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  userIcon: {
    marginRight: getResponsiveSpacing('xs'),
  },
  userName: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: getResponsiveFontSize('xs'),
  },
  commentTextContainer: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  commentText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing('xs'),
  },
  listMarker: {
    fontSize: getResponsiveFontSize('sm'),
    marginRight: getResponsiveSpacing('xs'),
  },
  listItemText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  emptyLine: {
    height: getResponsiveSpacing('xs'),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  actionText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('xs'),
  },
  replyInputContainer: {
    marginTop: getResponsiveSpacing('sm'),
  },
  replyInput: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButton: {
    marginRight: getResponsiveSpacing('sm'),
  },
  repliesContainer: {
    marginTop: getResponsiveSpacing('sm'),
  },
  replyContainer: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  replyContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    borderRadius: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('sm'),
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  replyUserName: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
    flex: 1,
  },
  replyTimestamp: {
    fontSize: getResponsiveFontSize('xs'),
  },
  replyTextContainer: {
    marginBottom: getResponsiveSpacing('xs'),
  },
  replyText: {
    fontSize: getResponsiveFontSize('xs'),
    lineHeight: getResponsiveFontSize('xs') * 1.4,
  },
  replyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  replyActionText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('xs'),
  },
}); 