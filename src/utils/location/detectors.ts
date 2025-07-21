// Location detection utilities

import { COUNTRY_DETECTION, COUNTRY_NAMES, PHILIPPINE_INDICATORS } from './constants';

/**
 * Detect the country from location string
 */
export function detectCountry(location: string): string | null {
  const parts = location.split(',').map(part => part.trim());
  
  // Check for country names in the last part
  const lastPart = parts[parts.length - 1]?.toLowerCase();
  if (lastPart) {
    for (const [code, names] of Object.entries(COUNTRY_NAMES)) {
      if (names.some(name => lastPart.includes(name.toLowerCase()))) {
        return code;
      }
    }
  }
  
  // Check for state/province patterns
  for (const [code, pattern] of Object.entries(COUNTRY_DETECTION)) {
    for (const part of parts) {
      if (pattern.test(part)) {
        return code;
      }
    }
  }
  
  // Special check for Philippine addresses without explicit country name
  // Look for common Philippine location indicators
  const locationLower = location.toLowerCase();
  for (const indicator of PHILIPPINE_INDICATORS) {
    if (locationLower.includes(indicator)) {
      return 'PH';
    }
  }
  
  return null;
}

/**
 * Check if a location string is likely from a specific country
 */
export function isLocationFromCountry(location: string, countryCode: string): boolean {
  return detectCountry(location) === countryCode;
}

/**
 * Get all possible countries for a location string
 */
export function getPossibleCountries(location: string): string[] {
  const countries: string[] = [];
  const parts = location.split(',').map(part => part.trim());
  
  // Check each part against country patterns
  for (const [code, pattern] of Object.entries(COUNTRY_DETECTION)) {
    for (const part of parts) {
      if (pattern.test(part) && !countries.includes(code)) {
        countries.push(code);
      }
    }
  }
  
  // Check for country names
  const locationLower = location.toLowerCase();
  for (const [code, names] of Object.entries(COUNTRY_NAMES)) {
    if (names.some(name => locationLower.includes(name.toLowerCase())) && !countries.includes(code)) {
      countries.push(code);
    }
  }
  
  return countries;
} 