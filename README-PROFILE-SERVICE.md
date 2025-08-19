# Profile Service for Supabase

This service provides a comprehensive way to interact with the `profiles` table in your Supabase database.

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { getProfile, getProfiles } from '../src/services/profileService';

// Get a single profile
const profile = await getProfile('user-uuid-here');

// Get multiple profiles
const profiles = await getProfiles({ limit: 20 });
```

### 2. Using the Hook

```typescript
import { useProfile } from '../src/hooks/useProfile';

function MyComponent() {
  const { profile, loading, error, fetchProfile } = useProfile({
    autoFetch: true,
    userId: 'user-uuid-here'
  });

  // Profile data is automatically fetched
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <View>
      <Text>{profile?.first_name} {profile?.last_name}</Text>
    </View>
  );
}
```

## 📋 Available Methods

### ProfileService Class

| Method | Description | Parameters |
|--------|-------------|------------|
| `getProfile(userId)` | Fetch single profile by user ID | `userId: string` |
| `getProfiles(params)` | Fetch multiple profiles with filters | `ProfileSearchParams` |
| `searchProfiles(term, limit)` | Search profiles by text | `term: string, limit?: number` |
| `getProfilesNearby(lat, lng, distance, limit)` | Get profiles within distance | `lat, lng, distanceKm, limit` |
| `updateProfile(userId, updates)` | Update existing profile | `userId: string, updates: Partial<Profile>` |
| `createProfile(profileData)` | Create new profile | `profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>` |
| `deleteProfile(userId)` | Delete profile | `userId: string` |

### useProfile Hook

The hook provides the same functionality with React state management:

```typescript
const {
  // State
  profile,        // Single profile
  profiles,       // Array of profiles
  loading,        // Loading state
  error,          // Error message
  
  // Actions
  fetchProfile,   // Fetch single profile
  fetchProfiles,  // Fetch multiple profiles
  searchProfiles, // Search profiles
  getNearbyProfiles, // Get nearby profiles
  updateProfile,  // Update profile
  createProfile,  // Create profile
  deleteProfile,  // Delete profile
  
  // Utilities
  clearError,     // Clear error state
  refreshProfile, // Refresh current profile
  refreshProfiles // Refresh profiles list
} = useProfile(options);
```

## 🔍 Filtering and Search

### Basic Filters

```typescript
// Filter by gender
const profiles = await getProfiles({
  filters: { gender: 'female' }
});

// Filter by age range
const profiles = await getProfiles({
  filters: { 
    minAge: 25, 
    maxAge: 35 
  }
});

// Filter by interests
const profiles = await getProfiles({
  filters: { 
    interests: ['hiking', 'photography'] 
  }
});
```

### Search Profiles

```typescript
// Search by name, bio, or interests
const results = await searchProfiles('hiking');
```

### Location-Based Search

```typescript
// Get profiles within 50km of coordinates
const nearby = await getProfilesNearby(
  37.7749,    // Latitude
  -122.4194,  // Longitude
  50,          // Max distance in km
  20           // Limit results
);
```

## 📊 Profile Data Structure

```typescript
interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  birthdate: string;
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
```

## 🛠️ Advanced Usage

### Custom Queries

```typescript
// Get profiles with custom filters
const profiles = await getProfiles({
  filters: {
    gender: 'female',
    minAge: 25,
    maxAge: 35,
    interests: ['hiking', 'photography']
  },
  limit: 50,
  offset: 0
});
```

### Batch Operations

```typescript
// Update multiple profiles
const updates = ['user1', 'user2', 'user3'].map(async (userId) => {
  return await updateProfile(userId, { is_online: false });
});

await Promise.all(updates);
```

### Error Handling

```typescript
try {
  const profile = await getProfile('user-id');
  if (profile) {
    console.log('Profile found:', profile.first_name);
  } else {
    console.log('Profile not found');
  }
} catch (error) {
  console.error('Failed to fetch profile:', error);
}
```

## 🔧 Configuration

Make sure your Supabase environment variables are set:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

## 📱 Example Component

See `src/components/examples/ProfileExample.tsx` for a complete working example.

## 🚨 Important Notes

1. **Row Level Security (RLS)**: Ensure your Supabase policies allow the operations you need
2. **Photo URLs**: The `photos` array should contain valid image URLs
3. **Distance Calculation**: For production apps, consider using PostGIS for more accurate distance calculations
4. **Rate Limiting**: Be mindful of API rate limits when making multiple requests

## 🆘 Troubleshooting

### Common Issues

1. **Profile not found**: Check if the user ID exists and RLS policies allow access
2. **Photos not loading**: Verify photo URLs are accessible and valid
3. **Location filtering not working**: Ensure latitude/longitude data is properly stored
4. **Authentication errors**: Check if user is properly authenticated

### Debug Mode

Enable debug logging to see detailed information:

```typescript
// The service automatically logs operations
console.log('🔍 Fetching profile for user:', userId);
console.log('✅ Profile fetched successfully:', data);
console.log('❌ Error fetching profile:', error);
```

## 🔗 Related Files

- `src/services/profileService.ts` - Main service class
- `src/hooks/useProfile.ts` - React hook wrapper
- `src/components/examples/ProfileExample.tsx` - Usage example
- `src/types/index.ts` - TypeScript interfaces
