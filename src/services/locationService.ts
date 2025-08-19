import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  formattedAddress?: string;
  addressData?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    [key: string]: any;
  };
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

// Photon API interfaces (OpenStreetMap-based, free alternative to Pelias)
interface PhotonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    osm_type: string;
    osm_id: number;
    osm_key: string;
    osm_value: string;
    type: string;
    countrycode: string;
    name: string;
    country: string;
    state?: string;
    city?: string;
    county?: string;
    postcode?: string;
    street?: string;
    housenumber?: string;
    extent?: [number, number, number, number];
    [key: string]: any;
  };
}

interface PhotonSearchResponse {
  type: string;
  features: PhotonFeature[];
}

interface PhotonReverseResponse {
  type: string;
  features: PhotonFeature[];
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
  private static readonly OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';
  private static readonly REQUEST_DELAY = 1000; // 1 second delay between requests
  private static lastRequestTime = 0;

  // Alternative geocoding services - Photon only
  private static readonly FALLBACK_SERVICES = [
    {
      name: 'Photon (OpenStreetMap)',
      baseUrl: 'https://photon.komoot.io',
      working: true,
      type: 'photon'
    },
    {
      name: 'LocationIQ (Fallback)',
      baseUrl: 'https://us1.locationiq.com/v1',
      working: false, // Disabled by default, can be enabled with API key
      type: 'locationiq'
    }
  ];

  /**
   * Check if any geocoding services are accessible
   */
  static async isAnyGeocodingServiceAccessible(): Promise<boolean> {
    try {
      console.log('🌍 LocationService: Checking geocoding service accessibility...');
      
      // First check if we have general internet connectivity
      const isNetworkAvailable = await this.isNetworkAvailable();
      if (!isNetworkAvailable) {
        console.warn('⚠️ LocationService: No internet connectivity available');
        return false;
      }
      
      // Now check specific geocoding services
      for (const service of this.FALLBACK_SERVICES) {
        if (service.working) {
          try {
            console.log(`🌍 LocationService: Testing ${service.name}...`);
            
            if (service.type === 'photon') {
              // Test Photon service
              const response = await fetch(`${service.baseUrl}/api?q=test&limit=1`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
              });
              if (response.ok) {
                console.log(`✅ LocationService: ${service.name} is accessible`);
                return true;
              }
            } else if (service.type === 'locationiq') {
              // Test LocationIQ service
              const response = await fetch(`${service.baseUrl}/v1/search?format=json&q=test&limit=1`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
              });
              if (response.ok) {
                console.log(`✅ LocationService: ${service.name} is accessible`);
                return true;
              }
            }
          } catch (error) {
            console.warn(`⚠️ LocationService: ${service.name} is not accessible:`, error);
          }
        }
      }
      
      console.warn('⚠️ LocationService: No geocoding services are accessible');
      return false;
    } catch (error) {
      console.warn('⚠️ LocationService: Service accessibility check failed:', error);
      return false;
    }
  }

  /**
   * Check network connectivity
   */
  static async isNetworkAvailable(): Promise<boolean> {
    try {
      console.log('🌐 LocationService: Checking network connectivity...');
      
      // Use reliable endpoints that are almost always accessible
      const reliableEndpoints = [
        'https://httpbin.org/status/200',
        'https://www.google.com/favicon.ico',
        'https://cdn.jsdelivr.net/npm/expo@latest/package.json'
      ];
      
      for (const endpoint of reliableEndpoints) {
        try {
          console.log(`🌐 LocationService: Testing endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            console.log(`✅ LocationService: Network connectivity confirmed via: ${endpoint}`);
            return true;
          }
        } catch (error) {
          console.warn(`⚠️ LocationService: Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }
      
      console.warn('⚠️ LocationService: All reliable network connectivity checks failed');
      return false;
    } catch (error) {
      console.warn('⚠️ LocationService: Network connectivity check failed:', error);
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔐 LocationService: Requesting foreground location permissions...');
      
      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      console.log('🔐 LocationService: Foreground permission status:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ LocationService: Foreground location permission denied');
        return false;
      }

      console.log('✅ LocationService: Location permissions granted');
      return true;
    } catch (error) {
      console.error('❌ LocationService: Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location with reverse geocoding
   */
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      console.log('🌍 LocationService: Getting current location...');
      
      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = location.coords;
      console.log(`📍 LocationService: Got coordinates: ${latitude}, ${longitude}`);

      // Get address using Photon
      let address = null;
      let addressData = null;

      try {
        const isServiceAccessible = await this.isAnyGeocodingServiceAccessible();
        if (isServiceAccessible) {
          address = await this.reverseGeocode(latitude, longitude);
          
          // Get structured address data from Photon
          try {
            console.log('🌍 LocationService: Fetching structured address data from Photon...');
            const photonResult = await this.reverseGeocodeWithPhoton(latitude, longitude, 'https://photon.komoot.io');
            if (photonResult) {
              console.log('✅ LocationService: Structured address data fetched successfully');
              addressData = photonResult.addressData;
            } else {
              console.warn('⚠️ LocationService: Failed to fetch structured address data');
            }
          } catch (error) {
            console.warn('⚠️ LocationService: Error fetching structured address data:', error);
          }
        } else {
          console.warn('⚠️ LocationService: No geocoding services accessible, using fallback');
          const fallbackData = await this.fallbackGeocoding(latitude, longitude);
          address = {
            formatted_address: fallbackData.formattedAddress || fallbackData.address || 'Location unavailable'
          };
          addressData = fallbackData.addressData;
        }
      } catch (error) {
        console.warn('⚠️ LocationService: Reverse geocoding failed, using fallback:', error);
        const fallbackData = await this.fallbackGeocoding(latitude, longitude);
        address = {
          formatted_address: fallbackData.formattedAddress || fallbackData.address || 'Location unavailable'
        };
        addressData = fallbackData.addressData;
      }

      // Return the result
      return {
        latitude,
        longitude,
        address: typeof address === 'string' ? address : address?.formatted_address,
        formattedAddress: typeof address === 'string' ? address : address?.formatted_address,
        addressData: addressData || undefined,
      };
    } catch (error) {
      console.error('❌ LocationService: Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address information
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      console.log('🌍 LocationService: Starting reverse geocoding...');
      
      // Try Photon first (current working service)
      try {
        console.log('🌍 LocationService: Trying Photon reverse geocoding...');
        const photonResult = await this.reverseGeocodeWithPhoton(latitude, longitude, 'https://photon.komoot.io');
        if (photonResult) {
          console.log('✅ LocationService: Photon reverse geocoding successful');
          return photonResult.formattedAddress || photonResult.address || 'Location unavailable';
        }
      } catch (error) {
        console.warn('⚠️ LocationService: Photon reverse geocoding error:', error);
      }

      // Try LocationIQ as fallback
      console.log('🌍 LocationService: Trying LocationIQ reverse geocoding as fallback...');
      for (const service of this.FALLBACK_SERVICES) {
        if (service.working && service.type === 'locationiq') {
          try {
            const locationiqResult = await this.reverseGeocodeWithLocationIQ(latitude, longitude, service.baseUrl);
            if (locationiqResult) {
              console.log('✅ LocationService: LocationIQ reverse geocoding successful');
              return locationiqResult.formattedAddress || locationiqResult.address || 'Location unavailable';
            }
          } catch (error) {
            console.warn(`⚠️ LocationService: LocationIQ service ${service.name} failed:`, error);
            continue;
          }
        }
      }

      // Final fallback: return coordinates
      console.warn('⚠️ LocationService: All geocoding services failed, returning coordinates');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('❌ LocationService: Reverse geocoding completely failed:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /**
   * Search for places using multiple geocoding services
   */
  static async searchPlaces(query: string): Promise<PlaceResult[]> {
    try {
      console.log('🌍 LocationService: Starting place search...');
      
      // Try Photon first
      try {
        console.log('🌍 LocationService: Trying Photon search...');
        const photonResults = await this.searchWithPhoton(query, 'https://photon.komoot.io');
        if (photonResults.length > 0) {
          console.log('✅ LocationService: Photon search successful');
          return photonResults;
        }
      } catch (error) {
        console.warn('⚠️ LocationService: Photon search error:', error);
      }

      // Try LocationIQ as fallback
      console.log('🌍 LocationService: Trying LocationIQ search as fallback...');
      for (const service of this.FALLBACK_SERVICES) {
        if (service.working && service.type === 'locationiq') {
          try {
            const locationiqResults = await this.searchWithLocationIQ(query, service.baseUrl);
            if (locationiqResults.length > 0) {
              console.log('✅ LocationService: LocationIQ search successful');
              return locationiqResults;
            }
          } catch (error) {
            console.warn(`⚠️ LocationService: LocationIQ service ${service.name} failed:`, error);
            continue;
          }
        }
      }

      console.warn('⚠️ LocationService: All search services failed');
      return [];
    } catch (error) {
      console.error('❌ LocationService: Place search completely failed:', error);
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

  /**
   * Look up place by OSM ID using Photon
   */
  static async lookupPlaceByOsmId(osmId: string): Promise<PlaceResult | null> {
    try {
      console.log('🌍 LocationService: Looking up place by OSM ID:', osmId);
      
      // Use Photon to search for the OSM ID
      const response = await fetch(
        `https://photon.komoot.io/api?q=${osmId}&limit=1`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      return {
        place_id: feature.properties.osm_id.toString(),
        name: feature.properties.name,
        formatted_address: this.formatPhotonAddress(feature.properties),
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        },
        types: [feature.properties.type, feature.properties.osm_value].filter(Boolean),
        rating: 0.5,
      };
    } catch (error) {
      console.error('Error looking up place by OSM ID:', error);
      return null;
    }
  }

  /**
   * Geocode address to coordinates using Photon
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    try {
      if (!address.trim()) {
        return [];
      }

      console.log('🌍 LocationService: Geocoding address:', address);
      
      const response = await fetch(
        `https://photon.komoot.io/api?q=${encodeURIComponent(address)}&limit=5`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return [];
      }

      return data.features.map((feature) => ({
        formatted_address: this.formatPhotonAddress(feature.properties),
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        },
        address_components: [],
        place_id: feature.properties.osm_id.toString(),
        types: [feature.properties.type],
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  }

  /**
   * Search for places near a location using Photon
   */
  static async searchNearby(query: string, location: LocationData, radius: number = 5000): Promise<PlaceResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      console.log('🌍 LocationService: Searching nearby places:', query);
      
      // Photon supports location-based search with bias
      const response = await fetch(
        `https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=5&lat=${location.latitude}&lon=${location.longitude}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return [];
      }

      return data.features.map((feature, index) => ({
        place_id: feature.properties.name + '_' + index,
        name: feature.properties.name,
        formatted_address: this.formatPhotonAddress(feature.properties),
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        },
        types: [feature.properties.type, feature.properties.osm_value].filter(Boolean),
        rating: 0.5,
      }));
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
        return await this.lookupPlaceByOsmId(osmId);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  static async getAutocompleteSuggestions(query: string, location?: LocationData): Promise<any[]> {
    try {
      if (!query.trim() || query.length < 2) {
        return [];
      }

      let url = `${this.FALLBACK_SERVICES[0].baseUrl}/api?q=${encodeURIComponent(query)}&limit=5`;
      
      if (location) {
        url += `&lat=${location.latitude}&lon=${location.longitude}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }
      
      const data: PhotonSearchResponse = await response.json();
      
      return data.features.map(item => ({
        place_id: `osm_${item.properties.osm_type[0]}${item.properties.osm_id}`,
        description: item.properties.name,
        structured_formatting: {
          main_text: item.properties.name,
          secondary_text: item.properties.osm_value,
        },
        geometry: {
          location: {
            lat: item.geometry.coordinates[1],
            lng: item.geometry.coordinates[0],
          },
        },
        types: [item.properties.type, item.properties.osm_value].filter(Boolean),
        rating: 0.5,
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

  /**
   * Simple fallback geocoding when external APIs are down
   */
  private static async fallbackGeocoding(latitude: number, longitude: number): Promise<LocationData> {
    console.log('🔄 LocationService: Using fallback geocoding...');
    
    // Basic location data without external API calls
    const result: LocationData = {
      latitude,
      longitude,
      address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      formattedAddress: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      addressData: {
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'Unknown Country',
      }
    };
    
    // Try to provide some basic location context based on coordinates
    try {
      console.log('🔄 LocationService: Attempting Expo fallback geocoding...');
      
      // Use Expo's built-in reverse geocoding as a fallback
      const expoLocation = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (expoLocation && expoLocation.length > 0) {
        const expoData = expoLocation[0];
        console.log('✅ LocationService: Expo fallback data received:', expoData);
        
        result.address = expoData.name || result.address;
        result.formattedAddress = expoData.name || result.formattedAddress;
        
        if (expoData.city) result.addressData!.city = expoData.city;
        if (expoData.region) result.addressData!.state = expoData.region;
        if (expoData.country) result.addressData!.country = expoData.country;
        
        console.log('✅ LocationService: Fallback geocoding completed with Expo data');
      } else {
        console.log('⚠️ LocationService: No Expo fallback data available');
      }
    } catch (error) {
      console.warn('⚠️ LocationService: Expo fallback geocoding failed:', error);
    }
    
    // If we still don't have good location data, try to infer from coordinates
    if (result.addressData!.city === 'Unknown City') {
      console.log('🔄 LocationService: Attempting coordinate-based location inference...');
      
      // Basic coordinate-based location inference
      const inferredLocation = this.inferLocationFromCoordinates(latitude, longitude);
      if (inferredLocation) {
        result.addressData!.city = inferredLocation.city || result.addressData!.city;
        result.addressData!.state = inferredLocation.state || result.addressData!.state;
        result.addressData!.country = inferredLocation.country || result.addressData!.country;
        
        result.address = `${result.addressData!.city}, ${result.addressData!.state}`;
        result.formattedAddress = `${result.addressData!.city}, ${result.addressData!.state}, ${result.addressData!.country}`;
        
        console.log('✅ LocationService: Coordinate-based inference completed');
      }
    }
    
    console.log('🔄 LocationService: Final fallback location data:', result);
    return result;
  }

  /**
   * Basic location inference from coordinates (for when all APIs fail)
   */
  private static inferLocationFromCoordinates(latitude: number, longitude: number): { city?: string; state?: string; country?: string } | null {
    // This is a very basic fallback - in a real app, you might have a local database
    // or use other offline location services
    
    // Example: Basic US location inference
    if (latitude >= 24.396308 && latitude <= 49.384358 && 
        longitude >= -125.000000 && longitude <= -66.934570) {
      return {
        country: 'United States',
        state: 'Unknown State',
        city: 'Unknown City'
      };
    }
    
    // Example: Basic European location inference
    if (latitude >= 35.0 && latitude <= 70.0 && 
        longitude >= -10.0 && longitude <= 40.0) {
      return {
        country: 'Europe',
        state: 'Unknown Region',
        city: 'Unknown City'
      };
    }
    
    return null;
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

  /**
   * Search for places using Pelias API
   */
  private static async searchWithPelias(query: string, baseUrl: string): Promise<PlaceResult[]> {
    try {
      console.log(`🌍 LocationService: Searching with Pelias at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/v1/search?text=${encodeURIComponent(query)}&size=10&api_key=`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Pelias search failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from Pelias search');
        return [];
      }

      console.log(`✅ LocationService: Pelias search returned ${data.features.length} results`);
      
      return data.features.map((feature, index) => ({
        place_id: feature.properties.name + '_' + index,
        name: feature.properties.name,
        formatted_address: feature.properties.name, // Photon doesn't provide a full address, just the name
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1], // latitude is second coordinate
            lng: feature.geometry.coordinates[0], // longitude is first coordinate
          },
        },
        types: [feature.type],
        rating: 0.5, // Default rating for Pelias results
      }));
    } catch (error) {
      console.warn(`⚠️ LocationService: Pelias search failed:`, error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates using Pelias API
   */
  private static async reverseGeocodeWithPelias(latitude: number, longitude: number, baseUrl: string): Promise<LocationData | null> {
    try {
      console.log(`🌍 LocationService: Reverse geocoding with Pelias at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/v1/reverse?point.lat=${latitude}&point.lon=${longitude}&size=1&api_key=`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Pelias reverse geocoding failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonReverseResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from Pelias reverse geocoding');
        return null;
      }

      const feature = data.features[0];
      const properties = feature.properties;
      
      console.log(`✅ LocationService: Pelias reverse geocoding successful`);
      
      return {
        latitude,
        longitude,
        address: properties.name, // Photon doesn't provide a full address, just the name
        name: properties.name,
        formattedAddress: properties.name, // Photon doesn't provide a full address, just the name
        addressData: {
          house_number: properties.housenumber,
          road: properties.street,
          suburb: undefined, // Photon doesn't provide suburb
          city: properties.city,
          county: properties.county,
          state: properties.state,
          postcode: properties.postcode,
          country: properties.country,
          country_code: properties.country_code,
        },
      };
    } catch (error) {
      console.warn(`⚠️ LocationService: Pelias reverse geocoding failed:`, error);
      return null;
    }
  }

  /**
   * Search for places using Photon API
   */
  private static async searchWithPhoton(query: string, baseUrl: string): Promise<PlaceResult[]> {
    try {
      console.log(`🌍 LocationService: Searching with Photon at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/api?q=${encodeURIComponent(query)}&limit=10`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Photon search failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from Photon search');
        return [];
      }

      console.log(`✅ LocationService: Photon search returned ${data.features.length} results`);
      
      return data.features.map((feature, index) => ({
        place_id: feature.properties.name + '_' + index,
        name: feature.properties.name,
        formatted_address: this.formatPhotonAddress(feature.properties),
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1], // latitude is second coordinate
            lng: feature.geometry.coordinates[0], // longitude is first coordinate
          },
        },
        types: [feature.properties.type, feature.properties.osm_value].filter(Boolean),
        rating: 0.5, // Default rating for Photon results
      }));
    } catch (error) {
      console.warn(`⚠️ LocationService: Photon search failed:`, error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates using Photon API
   */
  private static async reverseGeocodeWithPhoton(latitude: number, longitude: number, baseUrl: string): Promise<LocationData | null> {
    try {
      console.log(`🌍 LocationService: Reverse geocoding with Photon at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/reverse?lat=${latitude}&lon=${longitude}&limit=1`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Photon reverse geocoding failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonReverseResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from Photon reverse geocoding');
        return null;
      }

      const feature = data.features[0];
      const properties = feature.properties;
      
      console.log(`✅ LocationService: Photon reverse geocoding successful`);
      
      return {
        latitude,
        longitude,
        address: this.formatPhotonAddress(properties),
        name: properties.name,
        formattedAddress: this.formatPhotonAddress(properties),
        addressData: {
          house_number: properties.housenumber,
          road: properties.street,
          suburb: undefined, // Photon doesn't provide suburb
          city: properties.city,
          county: properties.county,
          state: properties.state,
          postcode: properties.postcode,
          country: properties.country,
          country_code: properties.countrycode,
        },
      };
    } catch (error) {
      console.warn(`⚠️ LocationService: Photon reverse geocoding failed:`, error);
      return null;
    }
  }

  /**
   * Search for places using LocationIQ API
   */
  private static async searchWithLocationIQ(query: string, baseUrl: string): Promise<PlaceResult[]> {
    try {
      console.log(`🌍 LocationService: Searching with LocationIQ at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/v1/search.php?format=json&q=${encodeURIComponent(query)}&limit=10`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LocationIQ search failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonSearchResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from LocationIQ search');
        return [];
      }

      console.log(`✅ LocationService: LocationIQ search returned ${data.features.length} results`);
      
      return data.features.map((feature, index) => ({
        place_id: feature.properties.osm_id.toString(),
        name: feature.properties.name,
        formatted_address: this.formatLocationIQAddress(feature.properties),
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        },
        types: [feature.properties.type, feature.properties.osm_value].filter(Boolean),
        rating: 0.5, // Default rating for LocationIQ results
      }));
    } catch (error) {
      console.warn(`⚠️ LocationService: LocationIQ search failed:`, error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates using LocationIQ API
   */
  private static async reverseGeocodeWithLocationIQ(latitude: number, longitude: number, baseUrl: string): Promise<LocationData | null> {
    try {
      console.log(`🌍 LocationService: Reverse geocoding with LocationIQ at ${baseUrl}`);
      
      const response = await fetch(
        `${baseUrl}/v1/reverse.php?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'SampRTC-DatingApp/1.0 (Dating App)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LocationIQ reverse geocoding failed: ${response.status} ${response.statusText}`);
      }

      const data: PhotonReverseResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('🌍 LocationService: No results from LocationIQ reverse geocoding');
        return null;
      }

      const feature = data.features[0];
      const properties = feature.properties;
      
      console.log(`✅ LocationService: LocationIQ reverse geocoding successful`);
      
      return {
        latitude,
        longitude,
        address: this.formatLocationIQAddress(properties),
        name: properties.name,
        formattedAddress: this.formatLocationIQAddress(properties),
        addressData: {
          house_number: properties.housenumber,
          road: properties.street,
          suburb: properties.neighbourhood,
          city: properties.city,
          county: properties.county,
          state: properties.state,
          postcode: properties.postcode,
          country: properties.country,
          country_code: properties.country_code,
        },
      };
    } catch (error) {
      console.warn(`⚠️ LocationService: LocationIQ reverse geocoding failed:`, error);
      return null;
    }
  }

  /**
   * Format address from Photon properties
   */
  private static formatPhotonAddress(properties: PhotonFeature['properties']): string {
    let address = '';
    if (properties.housenumber) {
      address += `${properties.housenumber} `;
    }
    if (properties.road) {
      address += `${properties.road}`;
    }
    if (properties.city) {
      address += `, ${properties.city}`;
    }
    if (properties.county) {
      address += `, ${properties.county}`;
    }
    if (properties.state) {
      address += `, ${properties.state}`;
    }
    if (properties.postcode) {
      address += `, ${properties.postcode}`;
    }
    if (properties.country) {
      address += `, ${properties.country}`;
    }
    return address.trim();
  }

  /**
   * Format address from LocationIQ properties
   */
  private static formatLocationIQAddress(properties: PhotonFeature['properties']): string {
    let address = '';
    if (properties.house_number) {
      address += `${properties.house_number} `;
    }
    if (properties.road) {
      address += `${properties.road}`;
    }
    if (properties.neighbourhood) {
      address += `, ${properties.neighbourhood}`;
    }
    if (properties.city) {
      address += `, ${properties.city}`;
    }
    if (properties.county) {
      address += `, ${properties.county}`;
    }
    if (properties.state) {
      address += `, ${properties.state}`;
    }
    if (properties.postcode) {
      address += `, ${properties.postcode}`;
    }
    if (properties.country) {
      address += `, ${properties.country}`;
    }
    return address.trim();
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