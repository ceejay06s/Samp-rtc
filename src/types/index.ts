export interface Theme {
  colors: {
    primary: string;
    onPrimary: string;
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
    disabled: string;
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
  conversation_id: string; // Database field name
  sender_id: string; // Database field name
  content: string;
  message_type: string; // Database field name
  is_read: boolean; // Database field name
  created_at: string; // Database field name
  type?: string; // Message type for UI
  // Additional fields for convenience
  conversationId?: string; // Alias for conversation_id
  senderId?: string; // Alias for sender_id
  messageType?: string; // Alias for message_type
  timestamp?: Date; // Alias for created_at
  read?: boolean; // Alias for is_read
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
  match_id: string; // Database field name
  last_message_id?: string; // Database field name
  unread_count?: number; // Database field name
  created_at: string; // Database field name
  updated_at: string; // Database field name
  // Additional fields for convenience
  matchId?: string; // Alias for match_id
  lastMessageId?: string; // Alias for last_message_id
  unreadCount?: number; // Alias for unread_count
  createdAt?: Date; // Alias for created_at
  updatedAt?: Date; // Alias for updated_at
  participants?: string[]; // Computed field
  lastMessage?: Message; // Populated field
  otherProfile?: Profile; // Populated field
  match?: Match; // Populated field
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
  // Database compatibility fields
  match_id?: string;
  caller_id?: string;
  receiver_id?: string;
  start_time?: string;
  end_time?: string;
}

// RTP and WebRTC related types
export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ENDED = 'ended',
  MISSED = 'missed',
  REJECTED = 'rejected',
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

export interface RTPCall {
  id: string;
  match_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  start_time?: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface RTPConnection {
  id: string;
  call_id: string;
  user_id: string;
  peer_connection_id: string;
  local_sdp?: string;
  remote_sdp?: string;
  ice_candidates: RTPIceCandidate[];
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface RTPIceCandidate {
  id: string;
  connection_id: string;
  candidate: string;
  sdp_mid?: string;
  sdp_mline_index?: number;
  created_at: string;
}

export interface RTPOffer {
  id: string;
  call_id: string;
  from_user_id: string;
  to_user_id: string;
  sdp: string;
  type: 'offer' | 'answer';
  created_at: string;
}

export interface RTPMediaStream {
  id: string;
  user_id: string;
  stream_type: 'audio' | 'video' | 'both';
  is_local: boolean;
  is_enabled: boolean;
  created_at: string;
}

export interface RTPCallStats {
  total_calls: number;
  total_duration: number;
  average_duration: number;
  missed_calls: number;
  successful_calls: number;
  call_quality_rating: number;
}

export interface RTPCallQuality {
  call_id: string;
  user_id: string;
  audio_level: number;
  video_quality?: number;
  network_latency: number;
  packet_loss: number;
  jitter: number;
  timestamp: string;
}

// Enhanced VoiceCall interface for database compatibility
export interface VoiceCallDB {
  id: string;
  match_id: string;
  caller_id: string;
  receiver_id: string;
  status: CallStatus;
  start_time?: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

// Post related types
export interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  tags?: string[];
  location?: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields
  user_profile?: Profile;
  liked_by_current_user?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: Profile;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
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