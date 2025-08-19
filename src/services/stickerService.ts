import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export interface StickerPack {
  id: string;
  name: string;
  shortname: string;
  stickerCount: number;
  previewUrl?: string;
}

export interface Sticker {
  id: string;
  name: string;
  url: string;
  packName: string;
  isAnimated: boolean;
  fileSize: number;
  createdAt: string;
  fileType: 'webp' | 'png' | 'gif' | 'tgs';
  isTelegramSticker: boolean;
  canAnimate: boolean;
}

export class StickerService {
  private static readonly STICKER_BUCKET = 'telegram-stickers';
  
  // Supported file extensions for stickers
  private static readonly SUPPORTED_EXTENSIONS = ['.webp', '.png', '.gif', '.tgs'] as const;
  
  // File type detection
  private static getFileType(filename: string): 'webp' | 'png' | 'gif' | 'tgs' | null {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'webp') return 'webp';
    if (ext === 'png') return 'png';
    if (ext === 'gif') return 'gif';
    if (ext === 'tgs') return 'tgs';
    return null;
  }
  
  // Check if file is a Telegram sticker (.tgs)
  private static isTelegramSticker(filename: string): boolean {
    return filename.toLowerCase().endsWith('.tgs');
  }
  
  // Check if file can be animated
  private static canAnimate(filename: string): boolean {
    const ext = filename.toLowerCase();
    return ext.endsWith('.gif') || ext.endsWith('.tgs');
  }
  
  // Check if file is a valid sticker
  private static isValidStickerFile(filename: string): boolean {
    return this.SUPPORTED_EXTENSIONS.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  }
  
  // Debug method to test different approaches
  static async debugBucketAccess() {
    console.log('🔍 Debugging bucket access...');
    console.log('Bucket name:', this.STICKER_BUCKET);
    
    try {
      // Test 1: List root with no options
      console.log('📁 Test 1: List root with no options');
      const { data: test1, error: error1 } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .list();
      console.log('Test 1 result:', { data: test1, error: error1 });
      
      // Test 2: List root with explicit options
      console.log('📁 Test 2: List root with explicit options');
      const { data: test2, error: error2 } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .list('', { limit: 1000 });
      console.log('Test 2 result:', { data: test2, error: error2 });
      
      // Test 3: Try to list a specific folder we know exists
      console.log('📁 Test 3: List cat_farsi folder directly');
      const { data: test3, error: error3 } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .list('cat_farsi');
      console.log('Test 3 result:', { data: test3, error: error3 });
      
      // Test 4: Check if we can get a public URL for a known file
      console.log('📁 Test 4: Get public URL for known file');
      const { data: urlData } = supabase.storage
        .from(this.STICKER_BUCKET)
        .getPublicUrl('cat_farsi/sticker_1.tgs');
      console.log('Test 4 result:', urlData);
      
      // Test 5: Try using the edge function for listing
      console.log('📁 Test 5: Use edge function for listing');
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('storage-operations', {
          body: { 
            operation: 'list', 
            bucket: this.STICKER_BUCKET, 
            path: '' 
          }
        });
        console.log('Test 5 result:', { data: edgeData, error: edgeError });
        
        // Test 6: Test .tgs file support
        if (edgeData?.files) {
          console.log('📁 Test 6: Testing .tgs file support');
          const tgsFiles = edgeData.files.filter((f: any) => f.name === 'cat_farsi');
          if (tgsFiles.length > 0) {
            console.log('Found cat_farsi folder, testing .tgs listing...');
            const { data: tgsData, error: tgsError } = await supabase.functions.invoke('storage-operations', {
              body: { 
                operation: 'list', 
                bucket: this.STICKER_BUCKET, 
                path: 'cat_farsi' 
              }
            });
            console.log('TGS files in cat_farsi:', tgsData?.files?.filter((f: any) => f.name?.endsWith('.tgs'))?.length || 0);
          }
        }
      } catch (edgeError) {
        console.log('Test 5 error:', edgeError);
      }
      
      return { test1, test2, test3, urlData, error1, error2, error3 };
    } catch (error) {
      console.error('Debug error:', error);
      return { error };
    }
  }
  
  // AsyncStorage keys for caching
  private static readonly CACHE_KEYS = {
    STICKER_PACKS: 'sticker_packs_cache',
    STICKERS_PREFIX: 'stickers_pack_',
    LAST_FETCH: 'sticker_packs_last_fetch',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  };

  /**
   * Get cached sticker packs or fetch from storage
   */
  static async getStickerPacks(): Promise<StickerPack[]> {
    try {
      // Try to get from cache first
      const cachedPacks = await this.getCachedStickerPacks();
      if (cachedPacks && cachedPacks.length > 0) {
        console.log('📱 Using cached sticker packs:', cachedPacks.length);
        return cachedPacks;
      }

      // If no cache, fetch from storage
      console.log('🌐 Fetching sticker packs from storage...');
      const packs = await this.fetchStickerPacksFromStorage();
      
      // Cache the results
      await this.cacheStickerPacks(packs);
      
      return packs;
    } catch (error) {
      console.error('Error getting sticker packs:', error);
      // Try to return cached data even if expired
      const cachedPacks = await this.getCachedStickerPacks();
      return cachedPacks || [];
    }
  }

  /**
   * Fetch sticker packs directly from Supabase storage
   */
  private static async fetchStickerPacksFromStorage(): Promise<StickerPack[]> {
    try {
      // Use the edge function that we know works
      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: { 
          operation: 'list', 
          bucket: this.STICKER_BUCKET, 
          path: '' 
        }
      });

      if (error) {
        console.error('Error fetching sticker packs via edge function:', error);
        return [];
      }

      if (!data || !data.files) {
        console.error('No data returned from edge function');
        return [];
      }

      console.log('Raw data from edge function:', data);
      console.log('Files count:', data.files?.length || 0);

      // The edge function returns folders directly
      const folders = data.files || [];
      console.log('Folders found:', folders.length);
      console.log('Folders:', folders.map((f: any) => f.name));

      // Group files by pack name (folder)
      const packMap = new Map<string, StickerPack>();
      
      // Process the folders we found
      folders.forEach((folder: any) => {
        const packName = folder.name;
        console.log('Found pack (folder):', packName);
        packMap.set(packName, {
          id: packName,
          name: this.formatPackName(packName),
          shortname: packName,
          stickerCount: 0,
        });
      });

      console.log('Detected packs:', Array.from(packMap.keys()));

      // Count stickers in each pack using edge function
      for (const [packName, pack] of packMap) {
        console.log('Counting stickers for pack:', packName);
        const { data: packData, error: packError } = await supabase.functions.invoke('storage-operations', {
          body: { 
            operation: 'list', 
            bucket: this.STICKER_BUCKET, 
            path: packName 
          }
        });
        
        if (packData && packData.files) {
          const stickerCount = packData.files.filter((file: any) => 
            file.name && this.isValidStickerFile(file.name)
          ).length;
          pack.stickerCount = stickerCount;
          console.log(`Pack ${packName} has ${stickerCount} stickers`);
          
          // Get preview image (first sticker in pack)
          const previewFile = packData.files.find((f: any) => 
            f.name && this.isValidStickerFile(f.name)
          );
          
          if (previewFile) {
            const { data: urlData } = supabase.storage
              .from(this.STICKER_BUCKET)
              .getPublicUrl(`${packName}/${previewFile.name}`);
            pack.previewUrl = urlData.publicUrl;
            console.log(`Preview URL for ${packName}:`, urlData.publicUrl);
          }
        } else if (packError) {
          console.error(`Error counting stickers for pack ${packName}:`, packError);
        }
      }

      return Array.from(packMap.values()).sort((a, b) => b.stickerCount - a.stickerCount);
    } catch (error) {
      console.error('Error getting sticker packs:', error);
      return [];
    }
  }

  /**
   * Get stickers from a specific pack
   */
  static async getStickersFromPack(packName: string, limit: number = 50): Promise<Sticker[]> {
    try {
      // Try to get from cache first
      const cachedStickers = await this.getCachedStickersForPack(packName);
      if (cachedStickers && cachedStickers.length > 0) {
        console.log('📱 Using cached stickers for pack:', packName);
        return cachedStickers.slice(0, limit);
      }

      // If no cache, fetch from storage using edge function
      console.log('🌐 Fetching stickers for pack from storage via edge function:', packName);
      const { data, error } = await supabase.functions.invoke('storage-operations', {
        body: { 
          operation: 'list', 
          bucket: this.STICKER_BUCKET, 
          path: packName 
        }
      });
      
      const files = data?.files || [];

      if (error) {
        console.error('Error listing stickers from pack:', error);
        return [];
      }

      const stickers: Sticker[] = [];
      
      for (const file of files.slice(0, limit)) {
        if (file.name && this.isValidStickerFile(file.name)) {
          const { data: urlData } = supabase.storage
            .from(this.STICKER_BUCKET)
            .getPublicUrl(`${packName}/${file.name}`);

          const fileType = this.getFileType(file.name);
          const isTelegramSticker = this.isTelegramSticker(file.name);
          const canAnimate = this.canAnimate(file.name);

          stickers.push({
            id: `${packName}_${file.name}`,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            url: urlData.publicUrl,
            packName: packName,
            isAnimated: canAnimate,
            fileSize: file.metadata?.size || 0,
            createdAt: file.created_at || new Date().toISOString(),
            fileType: fileType || 'webp',
            isTelegramSticker,
            canAnimate,
          });
        }
      }

      // Cache the results
      await this.cacheStickersForPack(packName, stickers);

      return stickers;
    } catch (error) {
      console.error('Error getting stickers from pack:', error);
      return [];
    }
  }

  /**
   * Search stickers across all packs
   */
  static async searchStickers(query: string, limit: number = 20): Promise<Sticker[]> {
    try {
      // Get all packs first
      const packs = await this.getStickerPacks();
      const allStickers: Sticker[] = [];

      // Search through each pack
      for (const pack of packs) {
        const stickers = await this.getStickersFromPack(pack.shortname, 100);
        const matchingStickers = stickers.filter(sticker => 
          sticker.name.toLowerCase().includes(query.toLowerCase()) ||
          pack.name.toLowerCase().includes(query.toLowerCase())
        );
        allStickers.push(...matchingStickers);
      }

      // Sort by relevance and limit results
      return allStickers
        .sort((a, b) => {
          // Prioritize exact name matches
          const aExactMatch = a.name.toLowerCase() === query.toLowerCase();
          const bExactMatch = b.name.toLowerCase() === query.toLowerCase();
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          return 0;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching stickers:', error);
      return [];
    }
  }

  /**
   * Get trending stickers (most recent or popular)
   */
  static async getTrendingStickers(limit: number = 20): Promise<Sticker[]> {
    try {
      const packs = await this.getStickerPacks();
      const trendingStickers: Sticker[] = [];

      // Get stickers from top packs
      for (const pack of packs.slice(0, 5)) {
        const stickers = await this.getStickersFromPack(pack.shortname, Math.ceil(limit / 5));
        trendingStickers.push(...stickers);
      }

      return trendingStickers.slice(0, limit);
    } catch (error) {
      console.error('Error getting trending stickers:', error);
      return [];
    }
  }

  /**
   * Get stickers by file type
   */
  static async getStickersByType(fileType: 'webp' | 'png' | 'gif' | 'tgs', limit: number = 20): Promise<Sticker[]> {
    try {
      const packs = await this.getStickerPacks();
      const typeStickers: Sticker[] = [];

      for (const pack of packs) {
        const stickers = await this.getStickersFromPack(pack.shortname, 100);
        const matchingStickers = stickers.filter(sticker => sticker.fileType === fileType);
        typeStickers.push(...matchingStickers);
      }

      return typeStickers.slice(0, limit);
    } catch (error) {
      console.error(`Error getting ${fileType} stickers:`, error);
      return [];
    }
  }

  /**
   * Get only Telegram stickers (.tgs files)
   */
  static async getTelegramStickers(limit: number = 20): Promise<Sticker[]> {
    return this.getStickersByType('tgs', limit);
  }

  /**
   * Get animated stickers (GIF and TGS files)
   */
  static async getAnimatedStickers(limit: number = 20): Promise<Sticker[]> {
    try {
      const packs = await this.getStickerPacks();
      const animatedStickers: Sticker[] = [];

      for (const pack of packs) {
        const stickers = await this.getStickersFromPack(pack.shortname, 100);
        const animated = stickers.filter(sticker => sticker.canAnimate);
        animatedStickers.push(...animated);
      }

      return animatedStickers.slice(0, limit);
    } catch (error) {
      console.error('Error getting animated stickers:', error);
      return [];
    }
  }

  /**
   * Get sticker statistics across all packs
   */
  static async getStickerStats(): Promise<{
    totalPacks: number;
    totalStickers: number;
    byType: { [key: string]: number };
    animatedCount: number;
    telegramStickerCount: number;
  }> {
    try {
      const packs = await this.getStickerPacks();
      const stats = {
        totalPacks: packs.length,
        totalStickers: 0,
        byType: { webp: 0, png: 0, gif: 0, tgs: 0 },
        animatedCount: 0,
        telegramStickerCount: 0,
      };

      for (const pack of packs) {
        const stickers = await this.getStickersFromPack(pack.shortname, 1000);
        stats.totalStickers += stickers.length;
        
        stickers.forEach(sticker => {
          stats.byType[sticker.fileType]++;
          if (sticker.canAnimate) stats.animatedCount++;
          if (sticker.isTelegramSticker) stats.telegramStickerCount++;
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting sticker stats:', error);
      return {
        totalPacks: 0,
        totalStickers: 0,
        byType: { webp: 0, png: 0, gif: 0, tgs: 0 },
        animatedCount: 0,
        telegramStickerCount: 0,
      };
    }
  }

  /**
   * Get random stickers from different packs
   */
  static async getRandomStickers(limit: number = 20): Promise<Sticker[]> {
    try {
      const packs = await this.getStickerPacks();
      const randomStickers: Sticker[] = [];

      // Shuffle packs to get random selection
      const shuffledPacks = [...packs].sort(() => Math.random() - 0.5);

      for (const pack of shuffledPacks.slice(0, Math.min(5, packs.length))) {
        const stickers = await this.getStickersFromPack(pack.shortname, Math.ceil(limit / 5));
        randomStickers.push(...stickers);
      }

      // Shuffle and limit results
      return randomStickers
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting random stickers:', error);
      return [];
    }
  }

  /**
   * Format pack name for display
   */
  private static formatPackName(shortname: string): string {
    return shortname
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim();
  }

  /**
   * Check if storage bucket is accessible
   */
  static async checkStorageAccess(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STICKER_BUCKET)
        .list('', { limit: 1 });
      
      return !error && data !== null;
    } catch (error) {
      console.error('Storage access check failed:', error);
      return false;
    }
  }

  /**
   * Get cached sticker packs from AsyncStorage
   */
  private static async getCachedStickerPacks(): Promise<StickerPack[] | null> {
    try {
      const lastFetch = await AsyncStorage.getItem(this.CACHE_KEYS.LAST_FETCH);
      if (!lastFetch) return null;

      const cacheAge = Date.now() - parseInt(lastFetch);
      if (cacheAge > this.CACHE_KEYS.CACHE_DURATION) {
        console.log('📱 Cache expired, age:', Math.round(cacheAge / 1000), 'seconds');
        return null;
      }

      const cachedData = await AsyncStorage.getItem(this.CACHE_KEYS.STICKER_PACKS);
      if (cachedData) {
        const packs: StickerPack[] = JSON.parse(cachedData);
        console.log('📱 Cache hit, returning', packs.length, 'packs');
        return packs;
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  }

  /**
   * Cache sticker packs in AsyncStorage
   */
  private static async cacheStickerPacks(packs: StickerPack[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEYS.STICKER_PACKS, JSON.stringify(packs));
      await AsyncStorage.setItem(this.CACHE_KEYS.LAST_FETCH, Date.now().toString());
      console.log('📱 Cached', packs.length, 'sticker packs');
    } catch (error) {
      console.error('Error caching sticker packs:', error);
    }
  }

  /**
   * Cache stickers for a specific pack
   */
  private static async cacheStickersForPack(packName: string, stickers: Sticker[]): Promise<void> {
    try {
      const key = `${this.CACHE_KEYS.STICKERS_PREFIX}${packName}`;
      await AsyncStorage.setItem(key, JSON.stringify(stickers));
      console.log('📱 Cached', stickers.length, 'stickers for pack:', packName);
    } catch (error) {
      console.error('Error caching stickers for pack:', error);
    }
  }

  /**
   * Get cached stickers for a specific pack
   */
  private static async getCachedStickersForPack(packName: string): Promise<Sticker[] | null> {
    try {
      const key = `${this.CACHE_KEYS.STICKERS_PREFIX}${packName}`;
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        const stickers: Sticker[] = JSON.parse(cachedData);
        console.log('📱 Cache hit for pack', packName, ':', stickers.length, 'stickers');
        return stickers;
      }
    } catch (error) {
      console.error('Error reading cached stickers for pack:', error);
    }
    return null;
  }

  /**
   * Clear all sticker cache
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stickerKeys = keys.filter((key: string) => 
        key.startsWith(this.CACHE_KEYS.STICKERS_PREFIX) || 
        key === this.CACHE_KEYS.STICKER_PACKS ||
        key === this.CACHE_KEYS.LAST_FETCH
      );
      
      if (stickerKeys.length > 0) {
        await AsyncStorage.multiRemove(stickerKeys);
        console.log('📱 Cleared sticker cache, removed', stickerKeys.length, 'keys');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Force refresh sticker data (ignore cache)
   */
  static async refreshStickerPacks(): Promise<StickerPack[]> {
    console.log('🔄 Force refreshing sticker packs...');
    await this.clearCache();
    return this.fetchStickerPacksFromStorage();
  }
} 