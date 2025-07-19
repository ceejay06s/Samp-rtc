import { supabase } from '../../lib/supabase';
import { Post, PostComment, PostLike } from '../types';
import { PhotoUploadService } from './photoUpload';

export interface CreatePostData {
  content: string;
  images?: string[];
  tags?: string[];
  location?: string;
  is_public?: boolean;
}

export interface UpdatePostData {
  content?: string;
  tags?: string[];
  location?: string;
  is_public?: boolean;
}

export class PostService {
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
          user_profile:profiles!posts_user_id_fkey(*)
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
      console.error('Failed to create post:', error);
      throw new Error(`Post creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async uploadPostImages(photos: { uri: string; width: number; height: number; type: string }[]): Promise<string[]> {
    try {
      const uploadPromises = photos.map(async (photo) => {
        const result = await PhotoUploadService.uploadPhotoToServer(photo);
        return result;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Failed to upload post images:', error);
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserPosts(userId: string, includePrivate: boolean = false): Promise<Post[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user_profile:profiles!posts_user_id_fkey(*)
        `)
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

      return posts || [];
    } catch (error) {
      console.error('Failed to get user posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPublicPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profile:profiles!posts_user_id_fkey(*)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching public posts:', error);
        throw error;
      }

      return posts || [];
    } catch (error) {
      console.error('Failed to get public posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPost(postId: string, currentUserId?: string): Promise<Post | null> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_profile:profiles!posts_user_id_fkey(*)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }

      if (!post) {
        return null;
      }

      // Check if current user liked this post
      if (currentUserId) {
        const { data: like } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
          .single();

        post.liked_by_current_user = !!like;
      }

      return post;
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
          user_profile:profiles!posts_user_id_fkey(*)
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
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
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

      // Update likes count
      const { error: updateError } = await supabase.rpc('increment_post_likes', {
        post_id: postId
      });

      if (updateError) {
        console.error('Error updating likes count:', updateError);
        // Don't throw here as the like was added successfully
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      throw new Error(`Like failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async unlikePost(postId: string, userId: string): Promise<void> {
    try {
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

      // Update likes count
      const { error: updateError } = await supabase.rpc('decrement_post_likes', {
        post_id: postId
      });

      if (updateError) {
        console.error('Error updating likes count:', updateError);
        // Don't throw here as the unlike was successful
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw new Error(`Unlike failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPostComments(postId: string): Promise<PostComment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_profile:profiles!post_comments_user_id_fkey(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return comments || [];
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw new Error(`Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addComment(postId: string, userId: string, content: string): Promise<PostComment> {
    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          user_profile:profiles!post_comments_user_id_fkey(*)
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      if (!comment) {
        throw new Error('Comment creation failed');
      }

      // Update comments count
      const { error: updateError } = await supabase.rpc('increment_post_comments', {
        post_id: postId
      });

      if (updateError) {
        console.error('Error updating comments count:', updateError);
        // Don't throw here as the comment was added successfully
      }

      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw new Error(`Comment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        .single();

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

      // Update comments count
      const { error: updateError } = await supabase.rpc('decrement_post_comments', {
        post_id: comment.post_id
      });

      if (updateError) {
        console.error('Error updating comments count:', updateError);
        // Don't throw here as the comment was deleted successfully
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw new Error(`Comment deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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