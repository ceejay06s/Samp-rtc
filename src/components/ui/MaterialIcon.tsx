import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../utils/themes';

interface MaterialIconProps {
  name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({ 
  name, 
  size = 24, 
  color, 
  style 
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.text;

  return (
    <MaterialIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
    />
  );
};

// Icon name mappings for common use cases
export const IconNames = {
  // Navigation
  home: 'home' as const,
  dashboard: 'dashboard' as const,
  discover: 'explore' as const,
  matches: 'favorite' as const,
  messages: 'chat' as const,
  menu: 'menu' as const,
  settings: 'settings' as const,
  
  // Actions
  like: 'favorite' as const,
  pass: 'close' as const,
  superLike: 'star' as const,
  back: 'arrow-back' as const,
  forward: 'arrow-forward' as const,
  send: 'send' as const,
  search: 'search' as const,
  filter: 'filter-list' as const,
  info: 'info' as const,
  celebration: 'celebration' as const,
  error: 'error' as const,
  
  // Profile & Account
  profile: 'person' as const,
  camera: 'camera-alt' as const,
  gallery: 'photo-library' as const,
  edit: 'edit' as const,
  logout: 'logout' as const,
  
  // Communication
  call: 'call' as const,
  videocall: 'video-call' as const,
  microphone: 'mic' as const,
  microphoneOff: 'mic-off' as const,
  
  // Location
  location: 'location-on' as const,
  currentLocation: 'my-location' as const,
  
  // UI Elements
  close: 'close' as const,
  check: 'check' as const,
  add: 'add' as const,
  more: 'more-vert' as const,
  expand: 'expand-more' as const,
  collapse: 'expand-less' as const,
  
  // Preferences
  visibility: 'visibility' as const,
  visibilityOff: 'visibility-off' as const,
  notifications: 'notifications' as const,
  notificationsOff: 'notifications-off' as const,
  
  // Fullscreen
  fullscreen: 'fullscreen' as const,
  fullscreenExit: 'fullscreen-exit' as const,
} as const;

export type IconName = keyof typeof IconNames; 