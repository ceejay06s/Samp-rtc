export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    heart: string;
    star: string;
    sparkle: string;
    gradient: {
      primary: string[];
      secondary: string[];
      accent: string[];
      background: string[];
      card: string[];
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: string;
      letterSpacing?: number;
    };
    h2: {
      fontSize: number;
      fontWeight: string;
      letterSpacing?: number;
    };
    h3: {
      fontSize: number;
      fontWeight: string;
      letterSpacing?: number;
    };
    body: {
      fontSize: number;
      fontWeight: string;
      lineHeight?: number;
    };
    bodyBold: {
      fontSize: number;
      fontWeight: string;
      lineHeight?: number;
    };
    caption: {
      fontSize: number;
      fontWeight: string;
      lineHeight?: number;
    };
    button: {
      fontSize: number;
      fontWeight: string;
      letterSpacing?: number;
    };
  };
  shadows: {
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xl: number;
    round: number;
  };
  dating: {
    cardGradient: string[];
    likeButton: string;
    dislikeButton: string;
    superLike: string;
    matchGlow: string;
    profileCard: {
      background: string;
      border: string;
      shadow: string;
    };
  };
}

// Profile interface for database profiles table
export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  birthdate: string; // ISO date string (YYYY-MM-DD)
  gender: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  interests: string[];
  looking_for: string[];
  max_distance: number;
  min_age: number;
  max_age: number;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

// App User interface (extends Supabase User with profile data)
export interface AppUser {
  id: string;
  email: string;
  name: string;
  age: number;
  bio?: string;
  photos: string[];
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  preferences: {
    ageRange: {
      min: number;
      max: number;
    };
    distance: number;
    gender: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Match related types
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  level: number; // 1-4 match levels
  status: 'pending' | 'matched' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for database compatibility
  user1_id?: string;
  user2_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user1_profile?: Profile;
  user2_profile?: Profile;
  otherProfile?: Profile; // For convenience
}

// Match levels enum
export enum MatchLevel {
  LEVEL_1 = 1, // Basic messaging
  LEVEL_2 = 2, // Photo sharing
  LEVEL_3 = 3, // Voice messages
  LEVEL_4 = 4, // Voice calls
}

// Message related types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'location';
  timestamp: Date;
  read: boolean;
}

// Message types enum
export enum MessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  VOICE = 'voice',
  LOCATION = 'location',
}

// Conversation related types
export interface Conversation {
  id: string;
  matchId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Voice call related types
export interface VoiceCall {
  id: string;
  matchId: string;
  initiatorId: string;
  receiverId: string;
  status: 'pending' | 'active' | 'ended' | 'missed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  Discover: undefined;
  Matches: undefined;
  Profile: undefined;
  Chat: { matchId: string };
  VoiceCall: { matchId: string };
}; 