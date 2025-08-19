import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../../lib/AuthContext';

export function ProfileExample() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState('');
  
  // Hook for managing profiles
  const {
    profile,
    profiles,
    loading,
    error,
    fetchProfile,
    fetchProfiles,
    searchProfiles,
    getNearbyProfiles,
    updateProfile,
    createProfile,
    deleteProfile,
    clearError
  } = useProfile({ autoFetch: false });

  const handleFetchProfile = () => {
    if (userId.trim()) {
      fetchProfile(userId.trim());
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchProfiles(searchTerm.trim());
    }
  };

  const handleGetNearby = () => {
    // Example coordinates (San Francisco)
    getNearbyProfiles(37.7749, -122.4194, 50);
  };

  const handleUpdateProfile = async () => {
    if (user?.id) {
      await updateProfile({
        bio: 'Updated bio from example component!',
        updated_at: new Date().toISOString()
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Service Example</Text>
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fetch Single Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fetch Single Profile</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter User ID"
            value={userId}
            onChangeText={setUserId}
          />
          <TouchableOpacity 
            style={styles.button}
            onPress={handleFetchProfile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Fetch Profile'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={styles.profileDetail}>Email: {profile.user_id}</Text>
            {profile.bio && <Text style={styles.profileDetail}>Bio: {profile.bio}</Text>}
            <Text style={styles.profileDetail}>
              Photos: {profile.photos?.length || 0}
            </Text>
          </View>
        )}
      </View>

      {/* Search Profiles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Profiles</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Search term (name, bio, interests)"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetNearby}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Get Nearby Profiles'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleUpdateProfile}
          disabled={loading || !user?.id}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Update My Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Display Multiple Profiles */}
      {profiles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Found Profiles ({profiles.length})
          </Text>
          {profiles.map((profile, index) => (
            <View key={profile.id || index} style={styles.profileCard}>
              <Text style={styles.profileName}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text style={styles.profileDetail}>ID: {profile.user_id}</Text>
              {profile.bio && <Text style={styles.profileDetail}>Bio: {profile.bio}</Text>}
              <Text style={styles.profileDetail}>
                Photos: {profile.photos?.length || 0}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  profileDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
