// Location formatting types

export interface ParsedLocation {
  city?: string;
  state?: string;
  country?: string;
  fullAddress: string;
}

export interface LocationComponents {
  city?: string;
  state?: string;
  country?: string;
  displayName: string;
}

export type LocationFormat = 'full' | 'city-state' | 'city-only';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface WebAlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
} 