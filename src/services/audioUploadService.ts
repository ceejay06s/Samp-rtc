import { supabase } from '../../lib/supabase';

export interface AudioUploadData {
  audioBlob: Blob;
  conversationId: string;
  duration: number;
  metadata?: any;
}

export interface AudioUploadResult {
  success: boolean;
  messageId?: string;
  audioUrl?: string;
  error?: string;
}

export class AudioUploadService {
  private static instance: AudioUploadService;

  static getInstance(): AudioUploadService {
    if (!AudioUploadService.instance) {
      AudioUploadService.instance = new AudioUploadService();
    }
    return AudioUploadService.instance;
  }

  /**
   * Upload audio via Edge Function
   */
  async uploadAudioViaEdgeFunction(data: AudioUploadData): Promise<AudioUploadResult> {
    try {
      console.log('🎤 Starting audio upload via Edge Function');

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', user.id);

      // Convert blob to base64
      const base64Data = await this.blobToBase64(data.audioBlob);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `voice_${timestamp}_${randomString}.webm`;

      console.log('📤 Preparing upload data:', {
        fileName,
        conversationId: data.conversationId,
        userId: user.id,
        duration: data.duration,
        blobSize: data.audioBlob.size
      });

      // Prepare payload for Edge Function
      const payload = {
        audioData: base64Data,
        fileName,
        conversationId: data.conversationId,
        userId: user.id,
        duration: data.duration,
        metadata: data.metadata || {}
      };

      // Call Edge Function
      const { data: response, error } = await supabase.functions.invoke('upload-audio', {
        body: payload
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Edge Function failed: ${error.message}`);
      }

      if (!response || !response.success) {
        console.error('❌ Edge Function returned error:', response);
        throw new Error(response?.error || 'Unknown error from Edge Function');
      }

      console.log('✅ Audio upload successful:', response.data);

      return {
        success: true,
        messageId: response.data.messageId,
        audioUrl: response.data.audioUrl
      };

    } catch (error) {
      console.error('❌ Audio upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert blob to base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:audio/webm;base64, prefix if present
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Upload audio directly to storage (fallback method)
   */
  async uploadAudioDirect(data: AudioUploadData): Promise<AudioUploadResult> {
    try {
      console.log('🎤 Starting direct audio upload (fallback method)');

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `voice_${timestamp}_${randomString}.webm`;

      // Create organized path
      const audioPath = `voice/conversations/${data.conversationId}/${user.id}/${fileName}`;

      console.log('📤 Uploading to path:', audioPath);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(audioPath, data.audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(audioPath);

      console.log('✅ Direct upload successful:', urlData.publicUrl);

      return {
        success: true,
        audioUrl: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Direct upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get upload method preference
   */
  getUploadMethod(): 'edge-function' | 'direct' {
    // Prefer Edge Function, fallback to direct upload
    return 'edge-function';
  }
}
