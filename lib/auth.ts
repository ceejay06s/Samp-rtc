import { Provider } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface AuthError {
  message: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  user?: any
}

// OAuth sign in with provider
export const signInWithOAuth = async (provider: Provider): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'your-app-scheme://auth/callback', // Replace with your app's URL scheme
      },
    })

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    // OAuth sign in returns a URL for redirect, not user data immediately
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
    }
  }
}

// Sign out
export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
    }
  }
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
} 