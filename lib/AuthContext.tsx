import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAutoLocation } from '../src/hooks/useAutoLocation'
import { Profile } from '../src/types'
import { onAuthStateChange } from './auth'
import { supabase } from './supabase'

interface AuthContextType {
  user: any
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  locationSharing: boolean
  setLocationSharing: (enabled: boolean) => void
  manualLocationUpdate: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationSharing, setLocationSharing] = useState(true) // Default to enabled for dating app

  // Auto-location hook - automatically updates location when sharing is enabled
  const { manualLocationUpdate } = useAutoLocation({
    userId: user?.id,
    isLocationSharingEnabled: locationSharing,
    onLocationUpdate: (latitude, longitude) => {
      console.log('📍 User location updated:', { latitude, longitude });
      // Optionally refresh profile to get updated location
      if (profile) {
        setProfile(prev => prev ? {
          ...prev,
          latitude,
          longitude,
          updated_at: new Date().toISOString()
        } : null);
      }
    },
    onError: (error) => {
      console.error('🚨 Auto-location error:', error);
      // Could show a toast or handle error silently
    }
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(profileData)
        // Log current location if available
        if (profileData.latitude && profileData.longitude) {
          console.log('👤 User profile location:', {
            latitude: profileData.latitude,
            longitude: profileData.longitude,
            location: profileData.location
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}