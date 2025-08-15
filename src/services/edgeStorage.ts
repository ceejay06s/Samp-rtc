import { supabase } from '../../lib/supabase';

export interface EdgeStorageResult {
  success: boolean;
  url?: string;
  path?: string;
  files?: any[];
  error?: string;
  data?: any;
}

export class EdgeStorageService {
  /**
   * Upload a file using Edge Function
   */
  static async uploadFile(bucket: string, path: string, file: File): Promise<EdgeStorageResult> {
    try {
      // Convert file to base64
      const base64File = await this.fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: {
          operation: 'upload',
          bucket,
          path,
          file: base64File,
          fileType: file.type,
          fileName: path.includes('/') ? undefined : file.name // Only pass fileName if path doesn't include it
        }
      });

      if (error) {
        console.error('Edge Function upload error:', error);
        return { success: false, error: error.message || 'Upload failed' };
      }

      return { success: true, url: data.url, path: data.path, data };
    } catch (error) {
      console.error('Edge storage upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update a file using Edge Function
   */
  static async updateFile(bucket: string, path: string, file: File): Promise<EdgeStorageResult> {
    try {
      // Convert file to base64
      const base64File = await this.fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: {
          operation: 'update',
          bucket,
          path,
          file: base64File,
          fileType: file.type
        }
      });

      if (error) {
        console.error('Edge Function update error:', error);
        return { success: false, error: error.message || 'Update failed' };
      }

      return { success: true, url: data.url, path: data.path, data };
    } catch (error) {
      console.error('Edge storage update error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a file using Edge Function
   */
  static async deleteFile(bucket: string, path: string): Promise<EdgeStorageResult> {
    try {
      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: {
          operation: 'delete',
          bucket,
          path
        }
      });

      if (error) {
        console.error('Edge Function delete error:', error);
        return { success: false, error: error.message || 'Delete failed' };
      }

      return { success: true, path: data.path, data };
    } catch (error) {
      console.error('Edge storage delete error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * List files using Edge Function
   */
  static async listFiles(bucket: string, path?: string): Promise<EdgeStorageResult> {
    try {
      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: {
          operation: 'list',
          bucket,
          path
        }
      });

      if (error) {
        console.error('Edge Function list error:', error);
        return { success: false, error: error.message || 'List failed' };
      }

      return { success: true, files: data.files, path: data.path, data };
    } catch (error) {
      console.error('Edge storage list error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Convert file to base64 string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }


} 