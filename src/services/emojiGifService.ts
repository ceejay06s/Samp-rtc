// GIF and Sticker Service
// This service handles fetching GIFs from Giphy API and stickers from various sources


interface GifSearchResult {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
}

interface StickerSearchResult {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
}

// Giphy API configuration - will be fetched from Supabase Vault or environment
let GIPHY_API_KEY: string | null = null;

// Initialize Giphy API key from environment variable or Supabase Vault
const initializeGiphyKey = async (): Promise<string | null> => {
  try {
    if (GIPHY_API_KEY) {
      return GIPHY_API_KEY;
    }

    // First try to get from environment variable
    const envKey = process.env.EXPO_PUBLIC_GIPHY_API_KEY;
    if (envKey && envKey !== 'your_giphy_api_key_here') {
      GIPHY_API_KEY = envKey;
      return GIPHY_API_KEY;
    }

    // Note: Supabase Vault access requires server-side implementation
    // For client-side apps, environment variables are the recommended approach
    console.warn('No Giphy API key found in environment variables. For Supabase Vault access, use server-side functions.');
    return null;
  } catch (error) {
    console.warn('Error initializing Giphy API key:', error);
    return null;
  }
};

// Helper function to make Giphy API calls
const makeGiphyRequest = async (endpoint: string, params: Record<string, any> = {}) => {
  const apiKey = await initializeGiphyKey();
  if (!apiKey) {
    console.warn('Giphy API key not available, using fallback GIFs');
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      ...params
    });

    const response = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${searchParams}`);
    
    if (!response.ok) {
      console.warn(`Giphy API error: ${response.status}, using fallback GIFs`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn('Error making Giphy API request, using fallback GIFs:', error);
    return null;
  }
};

export class EmojiGifService {
  /**
   * Search for GIFs using Giphy API
   */
  static async searchGifs(query: string, limit: number = 20): Promise<GifSearchResult[]> {
    try {
      const result = await makeGiphyRequest('search', {
        q: query,
        limit: limit.toString(),
        rating: 'g',
        lang: 'en'
      });
      
      if (!result) {
        return this.getSampleGifs();
      }
      
      return result.data.map((gif: any) => ({
        id: gif.id.toString(),
        url: gif.images.fixed_height.url,
        title: gif.title,
        width: gif.images.fixed_height.width,
        height: gif.images.fixed_height.height,
      }));
    } catch (error) {
      console.error('Error searching GIFs:', error);
      // Fallback to sample GIFs
      return this.getSampleGifs();
    }
  }

  /**
   * Search for stickers using Giphy Stickers API
   */
  static async searchStickers(query: string, limit: number = 20): Promise<StickerSearchResult[]> {
    try {
      const result = await makeGiphyRequest('search', {
        q: query,
        limit: limit.toString(),
        rating: 'g',
        lang: 'en'
      });
      
      if (!result) {
        return this.getSampleStickers();
      }
      
      return result.data.map((sticker: any) => ({
        id: sticker.id.toString(),
        url: sticker.images.fixed_height.url,
        title: sticker.title,
        width: sticker.images.fixed_height.width,
        height: sticker.images.fixed_height.height,
      }));
    } catch (error) {
      console.error('Error searching stickers:', error);
      // Fallback to sample stickers
      return this.getSampleStickers();
    }
  }

  /**
   * Get trending GIFs
   */
  static async getTrendingGifs(limit: number = 20): Promise<GifSearchResult[]> {
    try {
      const result = await makeGiphyRequest('trending', {
        limit: limit.toString(),
        rating: 'g'
      });
      
      if (!result) {
        return this.getSampleGifs();
      }
      
      return result.data.map((gif: any) => ({
        id: gif.id.toString(),
        url: gif.images.fixed_height.url,
        title: gif.title,
        width: gif.images.fixed_height.width,
        height: gif.images.fixed_height.height,
      }));
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
      return this.getSampleGifs();
    }
  }

  /**
   * Get trending stickers
   */
  static async getTrendingStickers(limit: number = 20): Promise<StickerSearchResult[]> {
    try {
      const result = await makeGiphyRequest('trending', {
        limit: limit.toString(),
        rating: 'g'
      });
      
      if (!result) {
        return this.getSampleStickers();
      }
      
      return result.data.map((sticker: any) => ({
        id: sticker.id.toString(),
        url: sticker.images.fixed_height.url,
        title: sticker.title,
        width: sticker.images.fixed_height.width,
        height: sticker.images.fixed_height.height,
      }));
    } catch (error) {
      console.error('Error fetching trending stickers:', error);
      return this.getSampleStickers();
    }
  }

  /**
   * Get random GIFs
   */
  static async getRandomGifs(tag?: string, limit: number = 20): Promise<GifSearchResult[]> {
    try {
      const promises = Array.from({ length: limit }, () => 
        makeGiphyRequest('random', { tag })
      );
      
      const results = await Promise.all(promises);
      
      // Filter out null results and fall back to sample GIFs if all failed
      const validResults = results.filter(result => result !== null);
      if (validResults.length === 0) {
        return this.getSampleGifs();
      }
      
      return validResults.map((result: any) => ({
        id: result.data.id.toString(),
        url: result.data.images.fixed_height.url,
        title: result.data.title,
        width: result.data.images.fixed_height.width,
        height: result.data.images.fixed_height.height,
      }));
    } catch (error) {
      console.error('Error fetching random GIFs:', error);
      return this.getSampleGifs();
    }
  }

  /**
   * Get GIF by ID
   */
  static async getGifById(id: string): Promise<GifSearchResult | null> {
    try {
      const result = await makeGiphyRequest(id);
      
      return {
        id: result.data.id.toString(),
        url: result.data.images.fixed_height.url,
        title: result.data.title,
        width: result.data.images.fixed_height.width,
        height: result.data.images.fixed_height.height,
      };
    } catch (error) {
      console.error('Error fetching GIF by ID:', error);
      return null;
    }
  }

  /**
   * Get sample GIFs for development/testing
   */
  private static getSampleGifs(): GifSearchResult[] {
    return [
      {
        id: '1',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        title: 'Sample GIF 1',
        width: 480,
        height: 270,
      },
      {
        id: '2',
        url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
        title: 'Sample GIF 2',
        width: 480,
        height: 270,
      },
      {
        id: '3',
        url: 'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif',
        title: 'Sample GIF 3',
        width: 480,
        height: 270,
      },
      {
        id: '4',
        url: 'https://media.giphy.com/media/3o7TKDEqPQwNp3GNKw/giphy.gif',
        title: 'Sample GIF 4',
        width: 480,
        height: 270,
      },
      {
        id: '5',
        url: 'https://media.giphy.com/media/3o7TKDEqPQwNp3GNKw/giphy.gif',
        title: 'Sample GIF 5',
        width: 480,
        height: 270,
      },
      {
        id: '6',
        url: 'https://media.giphy.com/media/3o7TKDEqPQwNp3GNKw/giphy.gif',
        title: 'Sample GIF 6',
        width: 480,
        height: 270,
      },
    ];
  }

  /**
   * Get sample stickers for development/testing
   */
  private static getSampleStickers(): StickerSearchResult[] {
    return [
      {
        id: '1',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/1.png',
        title: 'Sample Sticker 1',
        width: 240,
        height: 240,
      },
      {
        id: '2',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/2.png',
        title: 'Sample Sticker 2',
        width: 240,
        height: 240,
      },
      {
        id: '3',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/3.png',
        title: 'Sample Sticker 3',
        width: 240,
        height: 240,
      },
      {
        id: '4',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/4.png',
        title: 'Sample Sticker 4',
        width: 240,
        height: 240,
      },
      {
        id: '5',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/5.png',
        title: 'Sample Sticker 5',
        width: 240,
        height: 240,
      },
      {
        id: '6',
        url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/1/1/6.png',
        title: 'Sample Sticker 6',
        width: 240,
        height: 240,
      },
    ];
  }
} 