// Giphy API service for GIF search and trending GIFs
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY || 'your-giphy-api-key';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GiphyGif {
  id: string;
  title: string;
  url: string;
  width: string;
  height: string;
  size: string;
  webp_url: string;
  webp_size: string;
  mp4_url: string;
  mp4_size: string;
}

export interface GiphySearchResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

export interface GiphyCategory {
  name: string;
  name_encoded: string;
  gif: {
    images: {
      original: { url: string };
      fixed_height: { url: string };
      fixed_width: { url: string };
    };
  };
}

export interface GiphyCategoriesResponse {
  data: GiphyCategory[];
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

export class GiphyService {
  /**
   * Check if Giphy API is properly configured
   */
  static isConfigured(): boolean {
    console.log('🎨 GIPHY API Key check:', {
      hasKey: GIPHY_API_KEY !== 'your-giphy-api-key',
      keyLength: GIPHY_API_KEY.length,
      keyPreview: GIPHY_API_KEY.substring(0, 10) + '...'
    });
    return GIPHY_API_KEY !== 'your-giphy-api-key' && GIPHY_API_KEY.length > 0;
  }

  /**
   * Search for GIFs using Giphy API
   */
  static async searchGifs(query: string, limit: number = 20, offset: number = 0): Promise<GiphyGif[]> {
    if (!this.isConfigured()) {
      console.warn('Giphy API key not configured. Please add EXPO_PUBLIC_GIPHY_API_KEY to your .env file');
      return [];
    }

    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      );

      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }

      const data: GiphySearchResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching Giphy GIFs:', error);
      return [];
    }
  }

  /**
   * Get trending GIFs from Giphy
   */
  static async getTrendingGifs(limit: number = 20, offset: number = 0): Promise<GiphyGif[]> {
    console.log('🎨 GIPHY getTrendingGifs called with:', { limit, offset });
    if (!this.isConfigured()) {
      console.warn('Giphy API key not configured. Please add EXPO_PUBLIC_GIPHY_API_KEY to your .env file');
      return [];
    }

    try {
      const url = `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
      console.log('🎨 GIPHY API URL:', url);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }

      const data: GiphySearchResponse = await response.json();
      console.log('🎨 GIPHY trending response:', data);
      return data.data || [];
    } catch (error) {
      console.error('Error getting trending Giphy GIFs:', error);
      return [];
    }
  }

  /**
   * Get GIFs by category
   */
  static async getGifsByCategory(category: string, limit: number = 20, offset: number = 0): Promise<GiphyGif[]> {
    if (!this.isConfigured()) {
      console.warn('Giphy API key not configured. Please add EXPO_PUBLIC_GIPHY_API_KEY to your .env file');
      return [];
    }

    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(category)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      );

      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }

      const data: GiphySearchResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting GIFs by category:', error);
      return [];
    }
  }

  /**
   * Get trending searches
   */
  static async getTrendingSearches(): Promise<string[]> {
    if (!this.isConfigured()) {
      console.warn('Giphy API key not configured. Please add EXPO_PUBLIC_GIPHY_API_KEY to your .env file');
      return [];
    }

    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/trending/searches?api_key=${GIPHY_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }

  /**
   * Get random GIFs from Giphy
   */
  static async getRandomGifs(limit: number = 20): Promise<GiphyGif[]> {
    if (!this.isConfigured()) {
      console.warn('Giphy API key not configured. Please add EXPO_PUBLIC_GIPHY_API_KEY to your .env file');
      return [];
    }

    try {
      const randomGifs: GiphyGif[] = [];
      
      // Get multiple random GIFs
      for (let i = 0; i < Math.min(limit, 10); i++) { // Limit to 10 to avoid rate limiting
        const response = await fetch(
          `${GIPHY_BASE_URL}/random?api_key=${GIPHY_API_KEY}&rating=g&tag=funny`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            randomGifs.push(data.data);
          }
        }
      }

      return randomGifs;
    } catch (error) {
      console.error('Error getting random Giphy GIFs:', error);
      return [];
    }
  }

  /**
   * Convert Giphy GIF to Sticker format
   */
  static convertGiphyToSticker(giphyGif: GiphyGif): any {
    console.log('🎨 Converting GIPHY GIF to sticker:', {
      id: giphyGif.id,
      title: giphyGif.title,
      webp_url: giphyGif.webp_url,
      url: giphyGif.url
    });
    
    const sticker = {
      id: giphyGif.id,
      name: giphyGif.title || 'GIF',
      url: giphyGif.webp_url || giphyGif.url,
      packName: 'Giphy',
      fileType: 'gif',
      isTelegramSticker: false,
      canAnimate: true,
      isAnimated: true,
      fileSize: parseInt(giphyGif.size) || 0,
      createdAt: new Date().toISOString(),
    };
    
    console.log('🎨 Converted sticker:', sticker);
    return sticker;
  }

  /**
   * Get popular GIF categories for the bottom subtabs
   */
  static getPopularCategories(): string[] {
    return ['Recent', 'Popular', 'Trending', 'Random', 'Funny', 'Cute', 'Reactions'];
  }
} 