import { Theme } from '../types';

export const lightTheme: Theme = {
  colors: {
    primary: '#FF2E63', // Vibrant hot pink
    onPrimary: '#FFFFFF', // Text/icons on primary
    secondary: '#08D9D6', // Electric cyan
    accent: '#FF9A56', // Vibrant orange
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceVariant: '#FFF5F7', // Soft pink tint
    text: '#1A1A2E', // Deep navy
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444', // Bright red
    success: '#10B981', // Emerald green
    warning: '#F59E0B', // Amber
    disabled: '#CCCCCC', // Grey for disabled elements
    // Dating app specific colors
    heart: '#FF2E63', // Hot pink for hearts
    star: '#FFD700', // Gold for stars
    sparkle: '#FF6B9D', // Sparkle pink
    gradient: {
      primary: ['#FF2E63', '#FF6B9D'], // Hot pink gradient
      secondary: ['#08D9D6', '#00B4D8'], // Cyan to blue gradient
      accent: ['#FF9A56', '#FFB347'], // Orange gradient
      background: ['#FFF5F7', '#FFFFFF'], // Soft gradient background
      card: ['#FFFFFF', '#FFF8FA'], // Card gradient
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 36,
      fontWeight: 'bold',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  },
  shadows: {
    small: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xl: 24,
    round: 50,
  },
  // Dating app specific styling
  dating: {
    cardGradient: ['#FF2E63', '#FF6B9D'],
    likeButton: '#FF2E63',
    dislikeButton: '#6B7280',
    superLike: '#08D9D6',
    matchGlow: '#FFD700',
    profileCard: {
      background: '#FFFFFF',
      border: '#FF2E63',
      shadow: 'rgba(255, 46, 99, 0.15)',
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    primary: '#FF2E63', // Keep vibrant hot pink
    onPrimary: '#FFFFFF', // Text/icons on primary
    secondary: '#08D9D6', // Keep electric cyan
    accent: '#FF9A56', // Keep vibrant orange
    background: '#0F0F23', // Deep dark background
    surface: '#1A1A2E', // Dark surface
    surfaceVariant: '#252547', // Dark surface with tint
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#2D2D44',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    disabled: '#4A4A6A', // Darker grey for disabled elements
    // Dating app specific colors
    heart: '#FF2E63',
    star: '#FFD700',
    sparkle: '#FF6B9D',
    gradient: {
      primary: ['#FF2E63', '#FF6B9D'],
      secondary: ['#08D9D6', '#00B4D8'],
      accent: ['#FF9A56', '#FFB347'],
      background: ['#0F0F23', '#1A1A2E'],
      card: ['#1A1A2E', '#252547'],
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 36,
      fontWeight: 'bold',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  },
  shadows: {
    small: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: '#FF2E63',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xl: 24,
    round: 50,
  },
  // Dating app specific styling
  dating: {
    cardGradient: ['#FF2E63', '#FF6B9D'],
    likeButton: '#FF2E63',
    dislikeButton: '#6B7280',
    superLike: '#08D9D6',
    matchGlow: '#FFD700',
    profileCard: {
      background: '#1A1A2E',
      border: '#FF2E63',
      shadow: 'rgba(255, 46, 99, 0.25)',
    },
  },
};

export const useTheme = (): Theme => {
  // For now, return light theme. Later we can add theme switching functionality
  return lightTheme;
}; 