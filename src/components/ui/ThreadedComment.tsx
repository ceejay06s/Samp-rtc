import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PostComment } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { Input } from './Input';

interface ThreadedCommentProps {
  comment: PostComment;
  currentUserId?: string;
  onReply?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  level?: number;
  maxLevel?: number;
}

export const ThreadedComment: React.FC<ThreadedCommentProps> = ({
  comment,
  currentUserId,
  onReply,
  onDelete,
  level = 0,
  maxLevel = 1,
}) => {
  const theme = useTheme();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(level === 0); // Auto-expand top level

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

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !currentUserId || submittingReply) return;

    try {
      setSubmittingReply(true);
      await onReply?.(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true); // Auto-expand to show the new reply
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const canReply = level === 0 && currentUserId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isOwnComment = currentUserId === comment.user_id;

  return (
    <View style={[
      styles.container,
      { 
        marginLeft: level === 1 ? getResponsiveSpacing('md') : 0,
        borderLeftWidth: level === 1 ? 2 : 0,
        borderLeftColor: theme.colors.border,
        paddingLeft: level === 1 ? getResponsiveSpacing('md') : 0
      }
    ]}>
      {/* Comment content */}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {comment.user_profile?.first_name || 'User'}
          </Text>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {formatTimeAgo(comment.created_at)}
          </Text>
        </View>
        
        {renderFormattedText(comment.content)}

        {/* Action buttons */}
        <View style={styles.actions}>
          {canReply && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReplyInput(!showReplyInput)}
            >
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                Reply
              </Text>
            </TouchableOpacity>
          )}
          
          {isOwnComment && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete?.(comment.id)}
            >
              <Text style={[styles.actionText, { color: theme.colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reply input */}
        {showReplyInput && (
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
                onPress={handleReplySubmit}
                loading={submittingReply}
                disabled={!replyText.trim()}
                size="small"
                style={styles.replyButton}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowReplyInput(false);
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
          {/* Show/hide replies button */}
          <TouchableOpacity
            style={styles.showRepliesButton}
            onPress={() => setShowReplies(!showReplies)}
          >
            <Text style={[styles.showRepliesText, { color: theme.colors.primary }]}>
              {showReplies ? 'Hide' : `Show`} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>

          {/* Replies list */}
          {showReplies && (
            <View style={styles.repliesList}>
              {comment.replies!.map((reply) => (
                <ThreadedComment
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  level={level + 1}
                  maxLevel={maxLevel}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  userName: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    marginRight: getResponsiveSpacing('sm'),
  },
  timestamp: {
    fontSize: getResponsiveFontSize('xs'),
  },
  commentText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
    marginBottom: getResponsiveSpacing('sm'),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  actionText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
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
  cancelButton: {
    marginRight: getResponsiveSpacing('sm'),
  },
  repliesContainer: {
    marginTop: getResponsiveSpacing('sm'),
  },
  showRepliesButton: {
    paddingVertical: getResponsiveSpacing('xs'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  showRepliesText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
  },
  repliesList: {
    marginTop: getResponsiveSpacing('xs'),
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
}); 