// Location formatting utilities

import { parseLocation } from './parsers';
import { LocationComponents, LocationFormat } from './types';

/**
 * Format location for display based on country
 */
export function formatLocationForDisplay(
  location?: string, 
  format: LocationFormat = 'full'
): string {
  if (!location) return '';
  
  const parsed = parseLocation(location);
  
  switch (format) {
    case 'city-only':
      return parsed.city || location;
    
    case 'city-state':
      if (parsed.city && parsed.state) {
        return `${parsed.city}, ${parsed.state}`;
      }
      return parsed.city || location;
    
    case 'full':
    default:
      const parts = [];
      if (parsed.city) parts.push(parsed.city);
      if (parsed.state) parts.push(parsed.state);
      if (parsed.country) parts.push(parsed.country);
      
      return parts.length > 0 ? parts.join(', ') : location;
  }
}

/**
 * Get location components for specific use cases
 */
export function getLocationComponents(location?: string): LocationComponents {
  const parsed = parseLocation(location);
  
  return {
    city: parsed.city,
    state: parsed.state,
    country: parsed.country,
    displayName: formatLocationForDisplay(location, 'full'),
  };
}

/**
 * Format location for different display contexts
 */
export function formatLocationForContext(
  location?: string,
  context: 'profile' | 'card' | 'list' | 'search' = 'profile'
): string {
  if (!location) return '';
  
  switch (context) {
    case 'card':
      // Shorter format for cards
      return formatLocationForDisplay(location, 'city-state');
    
    case 'list':
      // Medium format for lists
      return formatLocationForDisplay(location, 'city-state');
    
    case 'search':
      // Full format for search results
      return formatLocationForDisplay(location, 'full');
    
    case 'profile':
    default:
      // Full format for profiles
      return formatLocationForDisplay(location, 'full');
  }
}

/**
 * Create a short location display (city only)
 */
export function getShortLocation(location?: string): string {
  return formatLocationForDisplay(location, 'city-only');
}

/**
 * Create a medium location display (city, state)
 */
export function getMediumLocation(location?: string): string {
  return formatLocationForDisplay(location, 'city-state');
}

/**
 * Create a full location display (city, state, country)
 */
export function getFullLocation(location?: string): string {
  return formatLocationForDisplay(location, 'full');
}

/**
 * Validate location format
 */
export function validateLocationFormat(location?: string): boolean {
  if (!location) return false;
  
  const trimmed = location.trim();
  if (trimmed.length === 0) return false;
  
  // Basic validation - should have at least one comma or be a single word
  const parts = trimmed.split(',').map(part => part.trim()).filter(Boolean);
  return parts.length > 0;
}

/**
 * Clean and normalize location string
 */
export function normalizeLocation(location?: string): string {
  if (!location) return '';
  
  return location
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/,\s*,/g, ',') // Remove empty parts between commas
    .replace(/^,+|,+$/g, '') // Remove leading/trailing commas
    .trim();
} 