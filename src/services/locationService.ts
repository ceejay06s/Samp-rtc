import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  formattedAddress?: string;
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    html_attributions: string[];
  }>;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
  place_id: string;
  types: string[];
}

// Nominatim API interfaces
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    cuisine?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    addr?: any;
    [key: string]: any;
  };
}

export class LocationService {
  private static readonly NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
  private static readonly OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

  static async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      console.log('Location permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      console.log('Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 1,
      });

      const { latitude, longitude } = location.coords;
      
      // Get address for the current location
      const address = await this.reverseGeocode(latitude, longitude);
      
      return {
        latitude,
        longitude,
        address: address?.formatted_address,
        formattedAddress: address?.formatted_address,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error(`Failed to get current location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    try {
      const url = `${this.NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data: NominatimResult = await response.json();
      
      if (data && data.display_name) {
        return this.convertNominatimToGeocodingResult(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error in reverse geocoding, using Expo fallback:', error);
      
      // Fallback to Expo's reverse geocoding
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const result = results[0];
          return {
            formatted_address: [
              result.street,
              result.city,
              result.region,
              result.country
            ].filter(Boolean).join(', '),
            geometry: {
              location: { lat: latitude, lng: longitude }
            },
            address_components: [],
            place_id: `expo_${Date.now()}`,
            types: []
          };
        }
      } catch (expoError) {
        console.error('Expo reverse geocoding also failed:', expoError);
      }
      
      return null;
    }
  }

  static async searchPlaces(query: string, location?: LocationData): Promise<PlaceResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      let url = `${this.NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&extratags=1&limit=10`;
      
      // If location is provided, bias results to that location
      if (location) {
        url += `&viewbox=${location.longitude - 0.5},${location.latitude + 0.5},${location.longitude + 0.5},${location.latitude - 0.5}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data: NominatimResult[] = await response.json();
      
      return data.map(this.convertNominatimToPlaceResult);
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  static async searchNearbyPlaces(
    location: LocationData, 
    type: string = 'establishment', 
    radius: number = 5000
  ): Promise<PlaceResult[]> {
    try {
      // Map common Google Places types to Overpass amenity types
      const amenityMap: { [key: string]: string[] } = {
        restaurant: ['restaurant', 'fast_food', 'cafe', 'bar', 'pub'],
        food: ['restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'bakery', 'ice_cream'],
        establishment: ['restaurant', 'cafe', 'shop', 'bank', 'hospital', 'pharmacy', 'fuel'],
        tourist_attraction: ['attraction', 'museum', 'gallery', 'monument'],
        lodging: ['hotel', 'motel', 'hostel', 'guest_house'],
        shopping_mall: ['mall', 'marketplace'],
        gas_station: ['fuel'],
        bank: ['bank', 'atm'],
        hospital: ['hospital', 'clinic', 'pharmacy'],
        default: ['restaurant', 'cafe', 'shop', 'bank', 'fuel', 'hospital']
      };

      const amenities = amenityMap[type] || amenityMap.default;
      const amenityFilter = amenities.map(a => `["amenity"="${a}"]`).join('');
      
      // Create Overpass query
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node${amenityFilter}(around:${radius},${location.latitude},${location.longitude});
          way${amenityFilter}(around:${radius},${location.latitude},${location.longitude});
          relation${amenityFilter}(around:${radius},${location.latitude},${location.longitude});
        );
        out center meta;
      `;

      const response = await fetch(this.OVERPASS_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: overpassQuery,
      });
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.elements) {
        const places = data.elements
          .filter((element: OverpassElement) => element.lat && element.lon && element.tags?.name)
          .slice(0, 15)
          .map(this.convertOverpassToPlaceResult);
        
        return places;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching nearby places:', error);
      return [];
    }
  }

  static async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      // For OSM, we can try to get details using the place_id as OSM ID
      if (placeId.startsWith('osm_')) {
        const osmId = placeId.replace('osm_', '');
        const url = `${this.NOMINATIM_BASE}/lookup?format=json&osm_ids=${osmId}&addressdetails=1&extratags=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }
        
        const data: NominatimResult[] = await response.json();
        
        if (data && data.length > 0) {
          return this.convertNominatimToPlaceResult(data[0]);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  static async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    try {
      const url = `${this.NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=5`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data: NominatimResult[] = await response.json();
      
      return data.map(this.convertNominatimToGeocodingResult);
    } catch (error) {
      console.error('Error geocoding address, using Expo fallback:', error);
      
      // Fallback to Expo geocoding
      try {
        const results = await Location.geocodeAsync(address);
        return results.map(result => ({
          formatted_address: address,
          geometry: {
            location: { lat: result.latitude, lng: result.longitude }
          },
          address_components: [],
          place_id: `expo_${Date.now()}`,
          types: []
        }));
      } catch (expoError) {
        console.error('Expo geocoding also failed:', expoError);
        return [];
      }
    }
  }

  static async getAutocompleteSuggestions(query: string, location?: LocationData): Promise<any[]> {
    try {
      if (!query.trim() || query.length < 2) {
        return [];
      }

      let url = `${this.NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
      
      if (location) {
        url += `&viewbox=${location.longitude - 0.1},${location.latitude + 0.1},${location.longitude + 0.1},${location.latitude - 0.1}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data: NominatimResult[] = await response.json();
      
      return data.map(item => ({
        place_id: `osm_${item.osm_type[0]}${item.osm_id}`,
        description: item.display_name,
        structured_formatting: {
          main_text: item.display_name.split(',')[0],
          secondary_text: item.display_name.split(',').slice(1).join(',').trim(),
        },
        geometry: {
          location: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          },
        },
      }));
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  }

  static formatLocationName(place: PlaceResult): string {
    // Extract a clean, readable name for the location
    const name = place.name;
    const address = place.formatted_address;
    
    // If it's a specific place with a name, use the name
    if (name && !name.match(/^\d/)) { // Not starting with numbers (likely an address)
      return name;
    }
    
    // Otherwise use the formatted address
    return address;
  }

  static getLocationIcon(types: string[]): string {
    // Return appropriate emoji based on place types
    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
    if (types.includes('cafe') || types.includes('bakery')) return '☕';
    if (types.includes('bar') || types.includes('night_club')) return '🍻';
    if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
    if (types.includes('hospital') || types.includes('pharmacy')) return '🏥';
    if (types.includes('school') || types.includes('university')) return '🎓';
    if (types.includes('gym') || types.includes('spa')) return '💪';
    if (types.includes('park')) return '🌳';
    if (types.includes('church') || types.includes('mosque')) return '⛪';
    if (types.includes('gas_station')) return '⛽';
    if (types.includes('bank') || types.includes('atm')) return '🏦';
    if (types.includes('lodging')) return '🏨';
    if (types.includes('movie_theater')) return '🎬';
    if (types.includes('airport')) return '✈️';
    if (types.includes('subway_station') || types.includes('train_station')) return '🚇';
    
    return '📍'; // Default location pin
  }

  static async searchPopularNearbyPlaces(location: LocationData): Promise<PlaceResult[]> {
    try {
      // Search for popular place types near the location
      const popularTypes = ['restaurant', 'food', 'establishment', 'tourist_attraction', 'lodging'];
      const allResults: PlaceResult[] = [];

      for (const type of popularTypes) {
        const results = await this.searchNearbyPlaces(location, type, 2000);
        allResults.push(...results.slice(0, 3)); // Take top 3 from each category
      }

      // Remove duplicates and sort by name
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      return uniqueResults
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 15);
    } catch (error) {
      console.error('Error searching popular nearby places:', error);
      return [];
    }
  }

  static async saveLocationToProfile(userId: string, location: LocationData): Promise<boolean> {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Update user profile with current location
      const { error } = await supabase
        .from('profiles')
        .update({
          location: location.formattedAddress || location.address || `${location.latitude}, ${location.longitude}`,
          latitude: location.latitude,
          longitude: location.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving location to profile:', error);
        return false;
      }

      console.log('Location saved to user profile successfully');
      return true;
    } catch (error) {
      console.error('Error saving location to profile:', error);
      return false;
    }
  }

  static async getCurrentLocationAndSave(userId?: string, autoSave: boolean = false): Promise<LocationData | null> {
    try {
      const location = await this.getCurrentLocation();
      
      if (location && userId && autoSave) {
        await this.saveLocationToProfile(userId, location);
      }
      
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Helper method to convert Nominatim result to our PlaceResult format
  private static convertNominatimToPlaceResult(item: NominatimResult): PlaceResult {
    const name = item.address?.house_number && item.address?.road 
      ? `${item.address.house_number} ${item.address.road}`
      : item.display_name.split(',')[0];

    // Determine types based on class and type
    const types = [item.class, item.type].filter(Boolean);
    
    return {
      place_id: `osm_${item.osm_type[0]}${item.osm_id}`,
      name,
      formatted_address: item.display_name,
      geometry: {
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      },
      types,
    };
  }

  // Helper method to convert Nominatim result to GeocodingResult
  private static convertNominatimToGeocodingResult(item: NominatimResult): GeocodingResult {
    const addressComponents: AddressComponent[] = [];
    
    if (item.address) {
      Object.entries(item.address).forEach(([key, value]) => {
        if (value) {
          addressComponents.push({
            long_name: value as string,
            short_name: value as string,
            types: [key],
          });
        }
      });
    }

    return {
      formatted_address: item.display_name,
      geometry: {
        location: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      },
      address_components: addressComponents,
      place_id: `osm_${item.osm_type[0]}${item.osm_id}`,
      types: [item.class, item.type].filter(Boolean),
    };
  }

  // Helper method to convert Overpass result to PlaceResult
  private static convertOverpassToPlaceResult(element: OverpassElement): PlaceResult {
    const tags = element.tags || {};
    const name = tags.name || 'Unknown Place';
    
    // Build address from tags
    const addressParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:postcode'],
    ].filter(Boolean);
    
    const formatted_address = addressParts.length > 0 
      ? addressParts.join(', ')
      : `${name}, ${element.lat.toFixed(6)}, ${element.lon.toFixed(6)}`;

    // Determine types
    const types = [
      tags.amenity,
      tags.shop,
      tags.tourism,
      tags.leisure,
    ].filter(Boolean) as string[];

    return {
      place_id: `osm_${element.type[0]}${element.id}`,
      name,
      formatted_address,
      geometry: {
        location: {
          lat: element.lat,
          lng: element.lon,
        },
      },
      types,
    };
  }
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as number;
  };
} 