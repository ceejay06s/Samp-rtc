import { supabase } from '../../lib/supabase';

export interface StickerUploadOptions {
  packName: string;
  stickerName: string;
  file: File | Blob;
  isAnimated?: boolean;
}

export interface StickerPackInfo {
  name: string;
  shortname: string;
  description?: string;
  tags?: string[];
}

export class StickerUploadService {
  private static readonly STICKER_BUCKET = 'telegram-stickers';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Upload a single sticker to a pack
   */
  static async uploadSticker(options: StickerUploadOptions): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const { packName, stickerName, file, isAnimated = false } = options;

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit`
        };
      }

      // Determine file extension and content type
      const fileExtension = this.getFileExtension(file);
      const contentType = this.getContentType(fileExtension);
      
      if (!contentType) {
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}`
        };
      }

      // Create file path
      const fileName = `${stickerName}.${fileExtension}`;
      const filePath = `${packName}/${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .upload(filePath, file, {
          contentType,
          upsert: true,
          metadata: {
            packName,
            stickerName,
            isAnimated,
            uploadedAt: new Date().toISOString(),
          }
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STICKER_BUCKET)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Sticker upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload multiple stickers to a pack
   */
  static async uploadStickerPack(
    packInfo: StickerPackInfo,
    stickers: Array<{ name: string; file: File | Blob; isAnimated?: boolean }>
  ): Promise<{
    success: boolean;
    uploaded: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: false,
      uploaded: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Upload each sticker
      const uploadPromises = stickers.map(sticker => 
        this.uploadSticker({
          packName: packInfo.shortname,
          stickerName: sticker.name,
          file: sticker.file,
          isAnimated: sticker.isAnimated
        })
      );

      const uploadResults = await Promise.allSettled(uploadPromises);

      // Process results
      uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.uploaded++;
          } else {
            results.failed++;
            results.errors.push(`Sticker ${stickers[index].name}: ${result.value.error}`);
          }
        } else {
          results.failed++;
          results.errors.push(`Sticker ${stickers[index].name}: Upload failed`);
        }
      });

      results.success = results.uploaded > 0;
      return results;
    } catch (error) {
      console.error('Sticker pack upload error:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return results;
    }
  }

  /**
   * Delete a sticker from storage
   */
  static async deleteSticker(packName: string, stickerName: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const filePath = `${packName}/${stickerName}`;
      
      const { error } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Sticker deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete an entire sticker pack
   */
  static async deleteStickerPack(packName: string): Promise<{
    success: boolean;
    deletedFiles: number;
    error?: string;
  }> {
    try {
      // List all files in the pack
      const { data: files, error: listError } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .list(packName, { limit: 1000 });

      if (listError) {
        return {
          success: false,
          deletedFiles: 0,
          error: listError.message
        };
      }

      if (!files || files.length === 0) {
        return {
          success: true,
          deletedFiles: 0
        };
      }

      // Delete all files in the pack
      const filePaths = files.map(file => `${packName}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .remove(filePaths);

      if (deleteError) {
        return {
          success: false,
          deletedFiles: 0,
          error: deleteError.message
        };
      }

      return {
        success: true,
        deletedFiles: files.length
      };
    } catch (error) {
      console.error('Sticker pack deletion error:', error);
      return {
        success: false,
        deletedFiles: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get file extension from file
   */
  private static getFileExtension(file: File | Blob): string {
    if (file instanceof File) {
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        return fileName.substring(lastDotIndex + 1).toLowerCase();
      }
    }
    
    // Try to determine from MIME type
    const mimeType = file.type;
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    
    return 'bin';
  }

  /**
   * Get content type for file extension
   */
  private static getContentType(extension: string): string | null {
    const contentTypes: Record<string, string> = {
      'webp': 'image/webp',
      'gif': 'image/gif',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'tgs': 'application/json', // Telegram sticker format
    };

    return contentTypes[extension] || null;
  }

  /**
   * Validate sticker pack name
   */
  static validatePackName(name: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        error: 'Pack name cannot be empty'
      };
    }

    if (name.length > 50) {
      return {
        isValid: false,
        error: 'Pack name must be 50 characters or less'
      };
    }

    // Only allow alphanumeric characters, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return {
        isValid: false,
        error: 'Pack name can only contain letters, numbers, hyphens, and underscores'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate sticker name
   */
  static validateStickerName(name: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        error: 'Sticker name cannot be empty'
      };
    }

    if (name.length > 100) {
      return {
        isValid: false,
        error: 'Sticker name must be 100 characters or less'
      };
    }

    // Allow more characters in sticker names
    if (!/^[a-zA-Z0-9\s_-]+$/.test(name)) {
      return {
        isValid: false,
        error: 'Sticker name can only contain letters, numbers, spaces, hyphens, and underscores'
      };
    }

    return { isValid: true };
  }
} 