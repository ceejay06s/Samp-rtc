import { supabase } from '../../lib/supabase';
import { Post, PostComment, PostLike } from '../types';
import { EnhancedPhotoUploadService, PhotoType } from './enhancedPhotoUpload';

export interface CreatePostData {
  content: string;
  images?: string[];
  tags?: string[];
  location?: string;
  is_public?: boolean;
}

export interface UpdatePostData {
  content?: string;
  images?: string[];
  tags?: string[];
  location?: string;
  is_public?: boolean;
}

export class PostService {
  // Helper function to get user data from auth.users
  private static async getUserData(userId: string) {
    try {
      // Try to get user data from profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile && !profileError) {
        return profile;
      }

      // If no profile, try to get from auth.users via RPC
      const { data: authUser, error: authError } = await supabase
        .rpc('get_user_metadata', { user_id: userId });

      if (authUser && !authError) {
        return {
          id: userId,
          user_id: userId,
          first_name: authUser.first_name || '',
          last_name: authUser.last_name || '',
          photos: authUser.avatar_url ? [authUser.avatar_url] : [],
          birthdate: authUser.birthdate || null
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  static async createPost(userId: string, data: CreatePostData): Promise<Post> {
    try {
      console.log('Creating post for user:', userId, 'with data:', data);

      const postData = {
        user_id: userId,
        content: data.content,
        images: data.images || [],
        tags: data.tags || [],
        location: data.location,
        is_public: data.is_public !== false, // default to true
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          user_profile:profiles!posts_user_id_fkey(
            id,
            first_name,
            last_name,
            photos,
            birthdate
          )
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      if (!post) {
        throw new Error('Post creation failed - no data returned');
      }

      console.log('Post created successfully:', post);
      return post;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  static async uploadPostImages(photos: { uri: string; width: number; height: number; type: string }[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      try {
        // Convert to PhotoUploadResult format
        const photoData = {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          type: photo.type,
          fileName: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
        };

        const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
          photoData,
          PhotoType.GENERAL,
          `posts/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        );

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          console.error('Failed to upload photo:', result.error);
          throw new Error(`Failed to upload photo: ${result.error}`);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }
    }

    return uploadedUrls;
  }

  static async getUserPosts(userId: string, includePrivate: boolean = false): Promise<Post[]> {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!includePrivate) {
        query = query.eq('is_public', true);
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('Error fetching user posts:', error);
        throw error;
      }

      // Enrich posts with user data
      const enrichedPosts = await Promise.all(
        (posts || []).map(async (post) => {
          const userData = await this.getUserData(post.user_id);
          return {
            ...post,
            user_profile: userData
          };
        })
      );

      return enrichedPosts;
    } catch (error) {
      console.error('Failed to get user posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPublicPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching public posts:', error);
        throw error;
      }

      // Enrich posts with user data
      const enrichedPosts = await Promise.all(
        (posts || []).map(async (post) => {
          const userData = await this.getUserData(post.user_id);
          return {
            ...post,
            user_profile: userData
          };
        })
      );

      return enrichedPosts;
    } catch (error) {
      console.error('Failed to get public posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPost(postId: string, currentUserId?: string): Promise<Post | null> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }

      if (!post) {
        return null;
      }

      // Enrich post with user data
      const userData = await this.getUserData(post.user_id);
      const enrichedPost = {
        ...post,
        user_profile: userData
      };

      // Check if current user liked this post
      if (currentUserId) {
        const { data: like } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
          .maybeSingle();

        enrichedPost.liked_by_current_user = !!like;
      }

      return enrichedPost;
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  }

  static async updatePost(postId: string, userId: string, data: UpdatePostData): Promise<Post> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: post, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', userId)
        .select(`
          *,
          user_profile:profiles!posts_user_id_fkey(
            id,
            first_name,
            last_name,
            photos,
            birthdate
          )
        `)
        .single();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      if (!post) {
        throw new Error('Post not found or no permission to update');
      }

      return post;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw new Error(`Post update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw new Error(`Post deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async likePost(postId: string, userId: string): Promise<void> {
    try {
      console.log('Liking post:', postId, 'by user:', userId);
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        console.log('Post already liked by user');
        throw new Error('Post already liked');
      }

      // Add like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (likeError) {
        console.error('Error adding like:', likeError);
        throw likeError;
      }

      console.log('Like added successfully');
      
      // Update likes count directly (fallback if trigger doesn't work)
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (currentPost) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            likes_count: (currentPost.likes_count || 0) + 1
          })
          .eq('id', postId);

      if (updateError) {
        console.error('Error updating likes count:', updateError);
        // Don't throw here as the like was added successfully
        }
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      throw new Error(`Like failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      console.log('Unliking post:', postId, 'by user:', userId);
      
      // Remove like
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (unlikeError) {
        console.error('Error removing like:', unlikeError);
        throw unlikeError;
      }

      console.log('Like removed successfully');
      
      // Update likes count directly (fallback if trigger doesn't work)
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (currentPost) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            likes_count: Math.max((currentPost.likes_count || 0) - 1, 0)
          })
          .eq('id', postId);

      if (updateError) {
        console.error('Error updating likes count:', updateError);
        // Don't throw here as the unlike was successful
        }
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw new Error(`Unlike failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPostComments(postId: string): Promise<PostComment[]> {
    try {
      // Get all comments for the post
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      // Build threaded structure and enrich with user data
      const commentMap = new Map<string, PostComment>();
      const topLevelComments: PostComment[] = [];

      // First pass: create map of all comments and enrich with user data
      const enrichedComments = await Promise.all(
        (comments || []).map(async (comment) => {
          const userData = await this.getUserData(comment.user_id);
          return {
            ...comment,
            user_profile: userData,
            replies: [],
            is_expanded: false
          };
        })
      );

      // Second pass: build tree structure
      enrichedComments.forEach(comment => {
        commentMap.set(comment.id, comment);
      });

      enrichedComments.forEach(comment => {
        if (comment.parent_id) {
          // This is a reply
          const parentComment = commentMap.get(comment.parent_id);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          }
        } else {
          // This is a top-level comment
          topLevelComments.push(comment);
        }
      });

      return topLevelComments;
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw new Error(`Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addComment(postId: string, userId: string, content: string, parentId?: string): Promise<PostComment> {
    try {
      const commentData = {
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert(commentData)
        .select('*')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      if (!comment) {
        throw new Error('Comment creation failed');
      }

      // Enrich comment with user data
      const userData = await this.getUserData(comment.user_id);
      const enrichedComment = {
        ...comment,
        user_profile: userData
      };

      // Update comments count only for top-level comments
      if (!parentId) {
        const { data: currentPost } = await supabase
          .from('posts')
          .select('comments_count')
          .eq('id', postId)
          .single();

        if (currentPost) {
          const { error: updateError } = await supabase
            .from('posts')
            .update({ 
              comments_count: (currentPost.comments_count || 0) + 1
            })
            .eq('id', postId);

      if (updateError) {
        console.error('Error updating comments count:', updateError);
          }
        }
      }

      return enrichedComment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw new Error(`Comment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addReply(commentId: string, userId: string, content: string): Promise<PostComment> {
    try {
      // Get the parent comment to find the post_id
      const { data: parentComment } = await supabase
        .from('post_comments')
        .select('post_id')
        .eq('id', commentId)
        .single();

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      // Add the reply
      return await this.addComment(parentComment.post_id, userId, content, commentId);
    } catch (error) {
      console.error('Failed to add reply:', error);
      throw new Error(`Reply failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getCommentReplies(commentId: string): Promise<PostComment[]> {
    try {
      const { data: replies, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        throw error;
      }

      // Enrich replies with user data
      const enrichedReplies = await Promise.all(
        (replies || []).map(async (reply) => {
          const userData = await this.getUserData(reply.user_id);
          return {
            ...reply,
            user_profile: userData
          };
        })
      );

      return enrichedReplies;
    } catch (error) {
      console.error('Failed to get replies:', error);
      throw new Error(`Failed to fetch replies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Get comment to find post_id
      const { data: comment } = await supabase
        .from('post_comments')
        .select('post_id')
        .eq('id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!comment) {
        throw new Error('Comment not found or no permission to delete');
      }

      // Delete comment
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }

      // Update comments count directly (fallback if trigger doesn't work)
      const { data: currentPost } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', comment.post_id)
        .single();

      if (currentPost) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            comments_count: Math.max((currentPost.comments_count || 0) - 1, 0)
          })
          .eq('id', comment.post_id);

      if (updateError) {
        console.error('Error updating comments count:', updateError);
        // Don't throw here as the comment was deleted successfully
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw new Error(`Comment deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async editComment(commentId: string, content: string, userId: string): Promise<void> {
    try {
      // First, check if the comment exists and belongs to the user
      const { data: comment, error: fetchError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !comment) {
        console.error('Error fetching comment:', fetchError);
        throw new Error('Comment not found or no permission to edit');
      }

      // Update the comment
      const { error: updateError } = await supabase
        .from('post_comments')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating comment:', updateError);
        throw new Error('Failed to update comment');
      }

      console.log('Comment updated successfully');
    } catch (error) {
      console.error('Failed to edit comment:', error);
      throw new Error(`Failed to edit comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPostLikes(postId: string): Promise<PostLike[]> {
    try {
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching likes:', error);
        throw error;
      }

      return likes || [];
    } catch (error) {
      console.error('Failed to get likes:', error);
      throw new Error(`Failed to fetch likes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 