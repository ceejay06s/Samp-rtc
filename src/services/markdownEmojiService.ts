// Markdown + Emoji Service combining Markdown-it and Twemoji
// For rich text formatting with high-quality emoji rendering

import MarkdownIt from 'markdown-it';
import twemoji from 'twemoji';
import { EmojiService } from './emojiService';

export interface MarkdownEmojiData {
  id: string;
  text: string;
  formattedText: string;
  emojis: string[];
  twemojiUrls: string[];
  category: string;
}

export class MarkdownEmojiService {
  // Markdown-it instance with common plugins
  private static md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
  });

  // Twemoji CDN base URL
  private static readonly TWEMOJI_CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/';
  
  /**
   * Convert emoji shortcode to Twemoji URL
   */
  static getTwemojiUrl(emoji: string): string {
    try {
      const codePoint = twemoji.convert.toCodePoint(emoji);
      return `${this.TWEMOJI_CDN}${codePoint}.svg`;
    } catch (error) {
      console.warn('Failed to generate Twemoji URL for:', emoji);
      return emoji; // Fallback to original emoji
    }
  }

  /**
   * Parse markdown text and extract emojis using existing emoji database
   */
  static parseMarkdownWithEmojis(text: string): MarkdownEmojiData {
    // Extract emoji shortcodes using regex
    const emojiMatches = text.match(/:[\w_]+:/g) || [];
    const uniqueEmojis = [...new Set(emojiMatches)];
    
    // Convert shortcodes to actual emojis using EmojiService
    const emojis = uniqueEmojis.map(shortcode => {
      const emojiData = EmojiService.getEmojiByShortcode(shortcode);
      return emojiData ? emojiData.emoji : shortcode;
    });
    
    // Generate Twemoji URLs
    const twemojiUrls = emojis.map(emoji => this.getTwemojiUrl(emoji));
    
    // Parse markdown (excluding emoji shortcodes)
    const markdownText = text.replace(/:[\w_]+:/g, '');
    const formattedText = this.md.render(markdownText);
    
    return {
      id: `md-${Date.now()}`,
      text: text,
      formattedText: formattedText,
      emojis: emojis,
      twemojiUrls: twemojiUrls,
      category: 'Markdown'
    };
  }

  /**
   * Render markdown text with Twemoji emojis
   */
  static renderMarkdownWithTwemoji(text: string): string {
    // First convert shortcodes to emojis using EmojiService
    let processedText = text;
    const emojiMatches = text.match(/:[\w_]+:/g) || [];
    
    emojiMatches.forEach(shortcode => {
      const emojiData = EmojiService.getEmojiByShortcode(shortcode);
      if (emojiData) {
        processedText = processedText.replace(shortcode, emojiData.emoji);
      }
    });
    
    // Then parse markdown using markdown-it
    return this.md.render(processedText);
  }

  /**
   * Get all available emoji shortcodes from existing emoji database
   */
  static getAvailableShortcodes(): string[] {
    // Get all emojis from EmojiService and extract their shortcodes
    const allEmojis = EmojiService.getCategories().flatMap(category => category.emojis);
    return allEmojis.map(emoji => emoji.shortcode);
  }

  /**
   * Search emojis by shortcode or keyword using existing emoji database
   */
  static searchEmojis(query: string): any[] {
    // Use EmojiService's search functionality
    return EmojiService.searchEmojis(query);
  }

  /**
   * Get emojis by category using existing emoji database
   */
  static getEmojisByCategory(categoryName: string): any[] {
    // Use EmojiService's category functionality
    return EmojiService.getEmojisByCategory(categoryName);
  }

  /**
   * Convert emoji data to sticker format with Twemoji URLs
   */
  static convertEmojiToSticker(emojiData: any): any {
    const baseSticker = EmojiService.convertEmojiToSticker(emojiData);
    // Add Twemoji URL
    baseSticker.twemojiUrl = this.getTwemojiUrl(emojiData.emoji);
    return baseSticker;
  }

  /**
   * Process text with markdown and convert emojis to Twemoji
   */
  static processTextWithMarkdownAndTwemoji(text: string): {
    markdown: string;
    emojis: string[];
    twemojiUrls: string[];
    combinedText: string;
  } {
    // Extract and convert emojis
    const emojiMatches = text.match(/:[\w_]+:/g) || [];
    const emojis = emojiMatches.map(shortcode => {
      const emojiData = EmojiService.getEmojiByShortcode(shortcode);
      return emojiData ? emojiData.emoji : shortcode;
    });
    
    // Generate Twemoji URLs
    const twemojiUrls = emojis.map(emoji => this.getTwemojiUrl(emoji));
    
    // Replace shortcodes with emojis in text
    let combinedText = text;
    emojiMatches.forEach((shortcode, index) => {
      if (emojis[index] && emojis[index] !== shortcode) {
        combinedText = combinedText.replace(shortcode, emojis[index]);
      }
    });
    
    // Parse markdown
    const markdown = this.md.render(combinedText);
    
    return {
      markdown,
      emojis,
      twemojiUrls,
      combinedText
    };
  }
} 