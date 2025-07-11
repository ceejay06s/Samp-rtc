import { Provider } from '@supabase/supabase-js'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getCurrentUser, signInWithOAuth, signOut } from '../lib/auth'

export default function OAuthLogin() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  React.useEffect(() => {
    // Check if user is already logged in
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  const handleOAuthSignIn = async (provider: Provider) => {
    setLoading(true)
    try {
      const response = await signInWithOAuth(provider)
      
      if (response.success) {
        Alert.alert('Success', `Sign in with ${provider} initiated!`)
        // The user will be redirected to the OAuth provider
        // After successful authentication, they'll be redirected back to your app
      } else {
        Alert.alert('Error', response.error?.message || 'Sign in failed')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const response = await signOut()
      
      if (response.success) {
        setUser(null)
        Alert.alert('Success', 'Signed out successfully!')
      } else {
        Alert.alert('Error', response.error?.message || 'Sign out failed')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const OAuthButton = ({ provider, title, color }: { provider: Provider; title: string; color: string }) => (
    <TouchableOpacity
      style={[styles.oauthButton, { backgroundColor: color }]}
      onPress={() => handleOAuthSignIn(provider)}
      disabled={loading}
    >
      <Text style={styles.oauthButtonText}>{title}</Text>
    </TouchableOpacity>
  )

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.userInfo}>Email: {user.email}</Text>
        <TouchableOpacity
          style={[styles.oauthButton, { backgroundColor: '#ff4444' }]}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.oauthButtonText}>
            {loading ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with OAuth</Text>
      
      <OAuthButton
        provider="google"
        title={loading ? 'Signing in...' : 'Sign in with Google'}
        color="#4285F4"
      />
      
      <OAuthButton
        provider="github"
        title={loading ? 'Signing in...' : 'Sign in with GitHub'}
        color="#333"
      />
      
      <OAuthButton
        provider="discord"
        title={loading ? 'Signing in...' : 'Sign in with Discord'}
        color="#7289DA"
      />
      
      <OAuthButton
        provider="twitter"
        title={loading ? 'Signing in...' : 'Sign in with Twitter'}
        color="#1DA1F2"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  oauthButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  oauthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}) 