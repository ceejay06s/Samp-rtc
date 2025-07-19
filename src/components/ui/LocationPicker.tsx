import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LocationData, LocationService, PlaceResult } from '../../services/locationService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  onCancel: () => void;
  initialLocation?: LocationData;
  placeholder?: string;
  autoDetectLocation?: boolean; // Auto-detect and set current location when opening
  showSaveButton?: boolean; // Show save button for confirmation before selecting
}

interface RecentLocation extends LocationData {
  timestamp: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  initialLocation,
  placeholder = "Search for a place or address",
  autoDetectLocation = true,
  showSaveButton = true,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'nearby' | 'recent'>('search');
  const [selectedLocationForSave, setSelectedLocationForSave] = useState<LocationData | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, location?: LocationData) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        
        // Get both autocomplete suggestions and place search results
        const [autocompleteSuggestions, placeResults] = await Promise.all([
          LocationService.getAutocompleteSuggestions(query, location),
          LocationService.searchPlaces(query, location)
        ]);

        setSuggestions(autocompleteSuggestions);
        setSearchResults(placeResults);
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchQuery) {
             debouncedSearch(searchQuery, currentLocation || undefined);
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [searchQuery, currentLocation, debouncedSearch]);

  // Auto-detect current location on mount if enabled
  useEffect(() => {
    if (autoDetectLocation && !currentLocation) {
      getCurrentLocation(true); // Auto-select current location
    }
  }, [autoDetectLocation]);

  const getCurrentLocation = async (autoSelect: boolean = false) => {
    try {
      setLoadingCurrent(true);
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        loadNearbyPlaces(location);
        
        // Auto-select current location if requested
        if (autoSelect) {
          if (showSaveButton) {
            setSelectedLocationForSave(location);
          } else {
            handleLocationSelect(location);
          }
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const loadNearbyPlaces = async (location: LocationData) => {
    try {
      setLoadingNearby(true);
      const places = await LocationService.searchPopularNearbyPlaces(location);
      setNearbyPlaces(places);
    } catch (error) {
      console.error('Error loading nearby places:', error);
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    if (showSaveButton) {
      setSelectedLocationForSave(location);
    } else {
      // Immediate selection without save button
      const recentLocation: RecentLocation = {
        ...location,
        timestamp: Date.now(),
      };
      
      setRecentLocations(prev => {
        const filtered = prev.filter(loc => 
          loc.latitude !== location.latitude || loc.longitude !== location.longitude
        );
        return [recentLocation, ...filtered].slice(0, 5); // Keep last 5
      });

      onLocationSelect(location);
    }
  };

  const saveSelectedLocation = () => {
    if (!selectedLocationForSave) return;

    // Save to recent locations
    const recentLocation: RecentLocation = {
      ...selectedLocationForSave,
      timestamp: Date.now(),
    };
    
    setRecentLocations(prev => {
      const filtered = prev.filter(loc => 
        loc.latitude !== selectedLocationForSave.latitude || loc.longitude !== selectedLocationForSave.longitude
      );
      return [recentLocation, ...filtered].slice(0, 5); // Keep last 5
    });

    onLocationSelect(selectedLocationForSave);
  };

  const cancelSelection = () => {
    setSelectedLocationForSave(null);
  };

  const handlePlaceSelect = async (place: PlaceResult) => {
    const location: LocationData = {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      name: place.name,
      address: place.formatted_address,
      formattedAddress: place.formatted_address,
    };

    handleLocationSelect(location);
  };

  const handleSuggestionSelect = async (suggestion: any) => {
    try {
      setLoading(true);
      const details = await LocationService.getPlaceDetails(suggestion.place_id);
      
      if (details) {
        await handlePlaceSelect(details);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocationSelect = () => {
    if (currentLocation) {
      handleLocationSelect(currentLocation);
    }
  };

  const handleCurrentLocationPress = () => {
    getCurrentLocation(false);
  };

  const renderSearchResults = () => {
    if (!searchQuery) return null;

    const combinedResults = [
      ...suggestions.map(s => ({ ...s, type: 'suggestion' })),
      ...searchResults.map(s => ({ ...s, type: 'place' }))
    ];

    if (combinedResults.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No places found for &ldquo;{searchQuery}&rdquo;
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={combinedResults}
        keyExtractor={(item, index) => `${item.type}-${item.place_id || index}`}
        renderItem={({ item }) => {
          const isSelected = selectedLocationForSave && 
            (item.geometry?.location?.lat === selectedLocationForSave.latitude && 
             item.geometry?.location?.lng === selectedLocationForSave.longitude);
          
          return (
            <TouchableOpacity
              style={[
                styles.resultItem, 
                { borderBottomColor: theme.colors.border },
                isSelected && showSaveButton && { backgroundColor: `${theme.colors.primary}10` }
              ]}
              onPress={() => {
                if (item.type === 'suggestion') {
                  handleSuggestionSelect(item);
                } else {
                  handlePlaceSelect(item);
                }
              }}
            >
            <View style={styles.resultContent}>
              <Text style={[styles.resultIcon, { color: theme.colors.primary }]}>
                {item.type === 'suggestion' ? '🔍' : LocationService.getLocationIcon(item.types || [])}
              </Text>
              <View style={styles.resultText}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                  {item.structured_formatting?.main_text || item.name || item.description}
                </Text>
                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.structured_formatting?.secondary_text || item.formatted_address || item.description}
                </Text>
              </View>
            </View>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderNearbyPlaces = () => (
    <FlatList
      data={nearbyPlaces}
      keyExtractor={(item) => item.place_id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
          onPress={() => handlePlaceSelect(item)}
        >
          <View style={styles.resultContent}>
            <Text style={[styles.resultIcon, { color: theme.colors.primary }]}>
              {LocationService.getLocationIcon(item.types)}
            </Text>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.formatted_address}
              </Text>
            </View>
          </View>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={[styles.rating, { color: theme.colors.text }]}>⭐ {item.rating}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        loadingNearby ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Finding nearby places...
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {currentLocation ? 'No nearby places found' : 'Enable location to see nearby places'}
            </Text>
          </View>
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );

  const renderRecentLocations = () => (
    <FlatList
      data={recentLocations}
      keyExtractor={(item, index) => `recent-${index}`}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
          onPress={() => handleLocationSelect(item)}
        >
          <View style={styles.resultContent}>
            <Text style={[styles.resultIcon, { color: theme.colors.primary }]}>🕒</Text>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                {item.name || 'Recent Location'}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.formattedAddress || item.address}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No recent locations
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return renderSearchResults();
      case 'nearby':
        return renderNearbyPlaces();
      case 'recent':
        return renderRecentLocations();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>Choose Location</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.searchIcon, { color: theme.colors.textSecondary }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={[styles.currentLocationButton, { backgroundColor: theme.colors.surface }]}
        onPress={handleCurrentLocationPress}
        disabled={loadingCurrent}
      >
        <View style={styles.currentLocationContent}>
          <Text style={[styles.currentLocationIcon, { color: theme.colors.primary }]}>📍</Text>
          <View style={styles.currentLocationText}>
            <Text style={[styles.currentLocationTitle, { color: theme.colors.text }]}>
              {loadingCurrent ? 'Getting location...' : 'Use current location'}
            </Text>
            {currentLocation && (
              <Text style={[styles.currentLocationSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {currentLocation.formattedAddress}
              </Text>
            )}
          </View>
          {loadingCurrent && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>
      </TouchableOpacity>

      {/* Selected Location Preview */}
      {showSaveButton && selectedLocationForSave && (
        <View style={[styles.selectedLocationContainer, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
          <View style={styles.selectedLocationContent}>
            <Text style={[styles.selectedLocationIcon, { color: '#fff' }]}>✓</Text>
            <View style={styles.selectedLocationText}>
              <Text style={[styles.selectedLocationTitle, { color: '#fff' }]}>
                Selected Location
              </Text>
              <Text style={[styles.selectedLocationAddress, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
                {selectedLocationForSave.name || selectedLocationForSave.formattedAddress || selectedLocationForSave.address}
              </Text>
            </View>
          </View>
          
          <View style={styles.selectedLocationActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.selectedCancelButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={cancelSelection}
            >
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.selectedSaveButton, { backgroundColor: '#fff' }]}
              onPress={saveSelectedLocation}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'search' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => {
            setActiveTab('nearby');
            if (currentLocation && nearbyPlaces.length === 0) {
              loadNearbyPlaces(currentLocation);
            }
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'nearby' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Nearby
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'recent' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Searching...
            </Text>
          </View>
        )}
        
        {!loading && renderTabContent()}
      </View>
    </View>
  );
};

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: getResponsiveSpacing('xs'),
  },
  cancelText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  title: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Balance the cancel button
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: getResponsiveSpacing('md'),
    marginVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    height: 50,
  },
  searchIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize('md'),
    height: '100%',
  },
  clearButton: {
    padding: getResponsiveSpacing('xs'),
  },
  clearText: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  currentLocationButton: {
    marginHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('md'),
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
  },
  currentLocationIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  currentLocationSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('md'),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('md'),
    width: 24,
    textAlign: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
  },
  ratingContainer: {
    marginLeft: getResponsiveSpacing('sm'),
  },
  rating: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    marginTop: getResponsiveSpacing('sm'),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  emptyText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
  },
  selectedLocationContainer: {
    marginHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('md'),
    borderWidth: 2,
  },
  selectedLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  selectedLocationIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
    fontWeight: 'bold',
  },
  selectedLocationText: {
    flex: 1,
  },
  selectedLocationTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  selectedLocationAddress: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.3,
  },
  selectedLocationActions: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  actionButton: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    alignItems: 'center',
  },
  selectedCancelButton: {
    marginRight: getResponsiveSpacing('xs'),
  },
  selectedSaveButton: {
    marginLeft: getResponsiveSpacing('xs'),
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
}); 