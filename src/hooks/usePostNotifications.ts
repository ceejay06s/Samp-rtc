import { useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { hybridNotificationService } from '../services/notificationService';
import { supabase } from '../../lib/supabase';

export const usePostNotifications = () => {
  const { user } = useAuth();

  // Send notification for new post from followed users
  const sendNewPostNotification = useCallback(async (
    postId: string,
    postTitle: string,
    authorId: string,
    authorName: string
  ) => {
    if (!user || authorId === user.id) return false;

    try {
      // Check if user follows the author
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', authorId)
        .single();

      if (!follow) return false; // Not following this user

      // Check if user has post notifications enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('post_notifications, push_enabled')
        .eq('user_id', user.id)
        .single();

      if (!preferences?.post_notifications || !preferences?.push_enabled) {
        return false;
      }

      // Send notification
      return await hybridNotificationService.sendNewPostNotification(
        authorId,
        authorName,
        postTitle
      );
    } catch (error) {
      console.error('Error sending post notification:', error);
      return false;
    }
  }, [user]);

  // Send notification for new comment
  const sendNewCommentNotification = useCallback(async (
    commentId: string,
    comment: string,
    authorId: string,
    authorName: string,
    postId: string,
    postAuthorId: string
  ) => {
    if (!user || authorId === user.id) return false;

    try {
      // Check if user has comment notifications enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('comment_notifications, push_enabled')
        .eq('user_id', user.id)
        .single();

      if (!preferences?.comment_notifications || !preferences?.push_enabled) {
        return false;
      }

      // Send notification to post author (if different from comment author)
      if (postAuthorId !== authorId && postAuthorId === user.id) {
        return await hybridNotificationService.sendNewCommentNotification(
          authorId,
          authorName,
          comment,
          postId
        );
      }

      return false;
    } catch (error) {
      console.error('Error sending comment notification:', error);
      return false;
    }
  }, [user]);

  // Listen for new posts from followed users
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`posts:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `author_id=neq.${user.id}` // Not our own posts
        },
        async (payload) => {
          const post = payload.new;
          
          // Check if we follow this user
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', post.author_id)
            .single();

          if (follow) {
            // Get author's profile
            const { data: author } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', post.author_id)
              .single();

            if (author) {
              const authorName = author.full_name || author.username || 'Someone';
              await sendNewPostNotification(
                post.id,
                post.title || 'New post',
                post.author_id,
                authorName
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sendNewPostNotification]);

  // Listen for new comments
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`comments:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `author_id=neq.${user.id}` // Not our own comments
        },
        async (payload) => {
          const comment = payload.new;
          
          // Get the post to check if we're the author
          const { data: post } = await supabase
            .from('posts')
            .select('author_id, title')
            .eq('id', comment.post_id)
            .single();

          if (post && post.author_id === user.id) {
            // Get comment author's profile
            const { data: author } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', comment.author_id)
              .single();

            if (author) {
              const authorName = author.full_name || author.username || 'Someone';
              await sendNewCommentNotification(
                comment.id,
                comment.content,
                comment.author_id,
                authorName,
                comment.post_id,
                post.author_id
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sendNewCommentNotification]);

  return {
    sendNewPostNotification,
    sendNewCommentNotification
  };
};
