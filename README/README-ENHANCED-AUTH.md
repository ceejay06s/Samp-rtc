# Enhanced Authentication System

This document explains the enhanced authentication system that provides better state management and user experience.

## Overview

The enhanced authentication system provides:
- **Centralized State Management:** Single source of truth for auth state
- **Real-time Updates:** Automatic state synchronization across components
- **Online Status Tracking:** Automatic online/offline status management
- **Session Management:** Token refresh and expiry handling
- **Profile Management:** Automatic profile fetching and updates
- **App State Awareness:** Background/foreground state handling

## Architecture

### Components

1. **AuthStateService** (`src/services/authStateService.ts`)
   - Singleton service managing authentication state
   - Handles auth state changes and notifications
   - Manages online status and profile updates

2. **AuthContext** (`lib/AuthContext.tsx`)
   - React Context provider for auth state
   - Integrates with AuthStateService
   - Provides hooks for components

3. **useAuth Hook** (`lib/AuthContext.tsx`)
   - React hook for accessing auth state
   - Provides authentication actions and state

4. **useAuthState Hook** (`src/hooks/useAuthState.ts`)
   - Alternative hook for direct AuthStateService access
   - More granular control over auth state

## Features

### ✅ **Automatic Authentication State**

The system automatically:
- Detects existing sessions on app start
- Handles sign-in/sign-out events
- Manages token refresh
- Updates online status

### ✅ **Real-time State Updates**

All components using auth state automatically update when:
- User signs in/out
- Profile is updated
- Online status changes
- Session expires

### ✅ **Online Status Management**

Automatic online/offline status:
- Sets user online when signing in
- Sets user offline when signing out
- Handles app background/foreground transitions
- Updates last seen timestamp

### ✅ **Profile Management**

Automatic profile handling:
- Fetches profile on authentication
- Refreshes profile when needed
- Updates profile with location data
- Handles profile errors gracefully

## Usage

### Basic Usage with useAuth

```typescript
import { useAuth } from '../lib/AuthContext';

function MyComponent() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    loading, 
    signOut,
    refreshProfile 
  } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <View>
      <Text>Welcome, {user.email}!</Text>
      <Text>Profile: {profile?.first_name}</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

### Advanced Usage with useAuthState

```typescript
import { useAuthState } from '../src/hooks/useAuthState';

function AdvancedComponent() {
  const {
    isAuthenticated,
    user,
    profile,
    loading,
    lastLoginTime,
    sessionExpiry,
    signOut,
    refreshProfile,
    setOnlineStatus
  } = useAuthState();

  // More granular control
  const handleGoOffline = () => {
    setOnlineStatus(false);
  };

  return (
    <View>
      <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text>Last Login: {lastLoginTime}</Text>
      <Text>Session Expires: {sessionExpiry}</Text>
      <Button onPress={handleGoOffline} title="Go Offline" />
    </View>
  );
}
```

### Auth Status Indicator

```typescript
import { AuthStatusIndicator } from '../src/components/auth/AuthStatusIndicator';

function Dashboard() {
  return (
    <View>
      <AuthStatusIndicator />
      {/* Rest of dashboard content */}
    </View>
  );
}
```

## State Properties

### AuthState Interface

```typescript
interface AuthState {
  isAuthenticated: boolean;    // Whether user is authenticated
  user: any | null;           // Supabase user object
  profile: any | null;        // User profile data
  loading: boolean;           // Whether auth state is loading
  lastLoginTime: string | null; // When user last logged in
  sessionExpiry: string | null; // When session expires
}
```

### Available Actions

- `signOut()` - Sign out user and clear state
- `refreshProfile()` - Refresh user profile data
- `setOnlineStatus(isOnline)` - Set user online/offline status

### Available Getters

- `isAuthenticated()` - Check if user is authenticated
- `getUser()` - Get current user object
- `getProfile()` - Get current profile object
- `isLoading()` - Check if auth is loading
- `getLastLoginTime()` - Get last login timestamp
- `getSessionExpiry()` - Get session expiry timestamp

## Event Handling

### Auth State Changes

The system automatically handles these events:

1. **SIGNED_IN**
   - Fetches user profile
   - Sets user as online
   - Updates auth state
   - Notifies all listeners

2. **SIGNED_OUT**
   - Sets user as offline
   - Clears auth state
   - Notifies all listeners

3. **TOKEN_REFRESHED**
   - Updates session expiry
   - Maintains auth state
   - Notifies all listeners

### App State Changes

Automatic handling of app background/foreground:

- **App Active**: Sets user as online
- **App Background**: Sets user as offline
- **App Inactive**: Sets user as offline

## Error Handling

### Graceful Error Handling

The system handles errors gracefully:

```typescript
// Profile fetch errors
if (profileError) {
  console.error('❌ Failed to fetch profile:', profileError);
  // Continue with user data, profile will be null
}

// Network errors
catch (error) {
  console.error('❌ Error handling sign in:', error);
  // Maintain previous state, retry on next auth event
}
```

### Fallback Behavior

- If profile fetch fails, user data is still available
- If online status update fails, auth state is maintained
- If token refresh fails, user remains authenticated until session expires

## Performance Optimizations

### Efficient Updates

- **Debounced Updates**: App state changes are debounced to prevent spam
- **Conditional Updates**: Only update when necessary
- **Listener Management**: Automatic cleanup of listeners

### Memory Management

- **Singleton Pattern**: Single instance of AuthStateService
- **Automatic Cleanup**: Listeners are cleaned up on component unmount
- **State Immutability**: State updates create new objects

## Security Features

### Session Management

- **Automatic Token Refresh**: Handles token expiration
- **Secure Sign Out**: Clears all auth data
- **Session Validation**: Validates session on app start

### Online Status Security

- **User-Specific Updates**: Only update own online status
- **Automatic Cleanup**: Set offline on sign out
- **Background Handling**: Proper offline status when app is backgrounded

## Migration from Old System

### What Changed

1. **Centralized State**: All auth state now managed by AuthStateService
2. **Enhanced Features**: Added online status, session expiry, last login time
3. **Better Error Handling**: More robust error handling and fallbacks
4. **Performance**: More efficient state updates and listener management

### Migration Steps

1. **Update Imports**: Use new `useAuth` hook
2. **Add New Properties**: Access `isAuthenticated`, `lastLoginTime`, `sessionExpiry`
3. **Use New Actions**: Use `refreshProfile()` and `setOnlineStatus()`
4. **Remove Old Code**: Remove manual auth state management

### Backward Compatibility

The new system is backward compatible:
- Existing `useAuth()` calls continue to work
- Same interface for basic auth operations
- Gradual migration possible

## Troubleshooting

### Common Issues

1. **State Not Updating**
   - Check if component is wrapped in AuthProvider
   - Verify listener is properly subscribed
   - Check console for error messages

2. **Online Status Issues**
   - Verify app state handling is working
   - Check network connectivity
   - Review online status update logic

3. **Profile Not Loading**
   - Check database connection
   - Verify profile table exists
   - Review profile fetch logic

### Debug Information

Enable debug logging:

```typescript
// Check auth state
const authState = AuthStateService.getInstance().getCurrentState();
console.log('Current auth state:', authState);

// Check if authenticated
const isAuth = AuthStateService.getInstance().isAuthenticated();
console.log('Is authenticated:', isAuth);
```

## Future Enhancements

### Planned Features

- **Multi-device Support**: Handle multiple device sessions
- **Offline Mode**: Work without internet connection
- **Biometric Auth**: Fingerprint/face recognition
- **Social Login**: More OAuth providers

### Advanced Features

- **Session Analytics**: Track login patterns
- **Security Alerts**: Unusual login detection
- **Auto-logout**: Automatic logout on inactivity
- **Device Management**: Manage active sessions 