// Location parsing utilities

import { LOCATION_PATTERNS } from './constants';
import { detectCountry } from './detectors';
import { ParsedLocation } from './types';

/**
 * Parse location string based on detected country format
 */
function parseLocationByCountry(location: string, countryCode: string): ParsedLocation {
  const pattern = LOCATION_PATTERNS[countryCode as keyof typeof LOCATION_PATTERNS];
  if (!pattern) {
    return parseGenericLocation(location);
  }
  
  const match = location.match(pattern);
  if (!match) {
    return parseGenericLocation(location);
  }
  
  // Special handling for Philippine addresses
  if (countryCode === 'PH') {
    const [, part1, part2, part3, part4] = match;
    const parts = [part1, part2, part3, part4].filter(Boolean).map(p => p?.trim());
    
    // Philippine address formats:
    // 1. "Barangay, City/Municipality, Province, Philippines"
    // 2. "City/Municipality, Province, Philippines"
    // 3. "Barangay, City/Municipality, Province"
    // 4. "City/Municipality, Province"
    // 5. Complex addresses with multiple parts
    
    if (parts.length >= 4) {
      // For complex addresses, look for city and province specifically
      let city = '';
      let state = '';
      
      // Look for common Philippine cities
      const phCities = ['pasay', 'makati', 'quezon city', 'manila', 'taguig', 'pasig', 'marikina', 'caloocan', 'malabon', 'navotas', 'valenzuela', 'parañaque', 'las piñas', 'muntinlupa', 'mandaluyong', 'pasay', 'pateros', 'baguio', 'davao', 'cebu', 'iloilo', 'bacolod', 'zamboanga', 'general santos', 'butuan', 'iligan', 'olongapo', 'angeles', 'dagupan', 'naga', 'legazpi', 'roxas', 'puerto princesa', 'tagaytay', 'batangas', 'lipa', 'lucena', 'antipolo', 'cainta', 'taytay', 'angono', 'binangonan', 'cardona', 'morong', 'pililla', 'rodriguez', 'tanay', 'teresa', 'baras', 'jala-jala'];
      
      // Look for common Philippine provinces
      const phProvinces = ['metro manila', 'cebu', 'davao del sur', 'bulacan', 'laguna', 'cavite', 'pampanga', 'rizal', 'quezon', 'batangas', 'nueva ecija', 'pangasinan', 'iloilo', 'negros occidental', 'bohol', 'leyte', 'camarines sur', 'zamboanga del sur', 'misamis oriental', 'cotabato'];
      
      // Find city
      for (const part of parts) {
        const partLower = part.toLowerCase();
        for (const cityName of phCities) {
          if (partLower.includes(cityName) && !city) {
            city = part;
            break;
          }
        }
        if (city) break;
      }
      
      // Find province
      for (const part of parts) {
        const partLower = part.toLowerCase();
        for (const provinceName of phProvinces) {
          if (partLower.includes(provinceName) && !state) {
            // Clean up the province name (remove extra text)
            if (provinceName === 'metro manila') {
              state = 'Metro Manila';
            } else {
              state = part;
            }
            break;
          }
        }
        if (state) break;
      }
      
      if (city && state) {
        return {
          city: city,
          state: state,
          fullAddress: location.trim(),
        };
      }
    }
    
    if (parts.length === 4) {
      // Format: "Barangay, City/Municipality, Province, Philippines"
      return {
        city: `${parts[0]}, ${parts[1]}`, // Barangay, City/Municipality
        state: parts[2], // Province
        country: parts[3], // Philippines
        fullAddress: location.trim(),
      };
    } else if (parts.length === 3) {
      // Check if last part is "Philippines" or a province
      const lastPart = parts[2].toLowerCase();
      if (lastPart.includes('philippines') || lastPart.includes('filipino')) {
        // Format: "City/Municipality, Province, Philippines"
        return {
          city: parts[0], // City/Municipality
          state: parts[1], // Province
          country: parts[2], // Philippines
          fullAddress: location.trim(),
        };
      } else {
        // Format: "Barangay, City/Municipality, Province"
        return {
          city: `${parts[0]}, ${parts[1]}`, // Barangay, City/Municipality
          state: parts[2], // Province
          fullAddress: location.trim(),
        };
      }
    } else if (parts.length === 2) {
      // Format: "City/Municipality, Province"
      return {
        city: parts[0], // City/Municipality
        state: parts[1], // Province
        fullAddress: location.trim(),
      };
    } else if (parts.length === 1) {
      // Single part - could be city or province
      return {
        city: parts[0],
        fullAddress: location.trim(),
      };
    }
  }
  
  // Standard parsing for other countries
  const [, city, state, country] = match;
  
  return {
    city: city?.trim(),
    state: state?.trim(),
    country: country?.trim(),
    fullAddress: location.trim(),
  };
}

/**
 * Generic location parser for unknown formats
 */
function parseGenericLocation(location: string): ParsedLocation {
  const parts = location.split(',').map(part => part.trim()).filter(Boolean);
  
  if (parts.length === 0) {
    return { fullAddress: location };
  }
  
  if (parts.length === 1) {
    return {
      city: parts[0],
      fullAddress: location,
    };
  }
  
  if (parts.length === 2) {
    return {
      city: parts[0],
      state: parts[1],
      fullAddress: location,
    };
  }
  
  // For 3+ parts, assume: city, state, country
  return {
    city: parts[0],
    state: parts[1],
    country: parts.slice(2).join(', '),
    fullAddress: location,
  };
}

/**
 * Main function to parse location intelligently
 */
export function parseLocation(location?: string): ParsedLocation {
  if (!location) {
    return { fullAddress: '' };
  }
  
  const trimmedLocation = location.trim();
  if (!trimmedLocation) {
    return { fullAddress: '' };
  }
  
  // Detect country
  const countryCode = detectCountry(trimmedLocation);
  
  // Parse based on detected country
  if (countryCode) {
    return parseLocationByCountry(trimmedLocation, countryCode);
  }
  
  // Fallback to generic parsing
  return parseGenericLocation(trimmedLocation);
}

/**
 * Parse location with specific country format
 */
export function parseLocationWithCountry(location: string, countryCode: string): ParsedLocation {
  if (!location) {
    return { fullAddress: '' };
  }
  
  const trimmedLocation = location.trim();
  if (!trimmedLocation) {
    return { fullAddress: '' };
  }
  
  return parseLocationByCountry(trimmedLocation, countryCode);
} 