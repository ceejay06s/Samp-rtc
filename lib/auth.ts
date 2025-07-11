import { Provider } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import { config } from './config'
import { supabase } from './supabase'

export interface AuthError {
  message: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  user?: any
  session?: any
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  provider?: string
  created_at: string
  updated_at: string
}

// OAuth sign in with provider
export const signInWithOAuth = async (provider: Provider): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: config.github.redirectUri, // Use the correct app scheme from config
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
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

// Email/Password registration
export const signUpWithEmail = async (email: string, password: string, profile?: Partial<UserProfile>): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profile,
        emailRedirectTo: config.github.redirectUri, // Use the correct app scheme from config
      },
    })

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
    }
  }
}

// Email/Password sign in
export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
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

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    return {
      success: true,
      user: data,
    }
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
    }
  }
}

// Create user profile (called after OAuth sign in)
export const createUserProfile = async (user: any): Promise<AuthResponse> => {
  try {
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: user.app_metadata?.provider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: { message: error.message },
      }
    }

    return {
      success: true,
      user: data,
    }
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Unknown error occurred' },
    }
  }
}

// Reset password
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: config.github.redirectUri.replace('/auth/callback', '/auth/reset-password'), // Use the correct app scheme from config
    })

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

// Update password
export const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

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

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

export interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

export interface GitHubAuthResponse {
  success: boolean
  user?: GitHubUser
  accessToken?: string
  error?: {
    message: string
    code?: string
  }
}

class GitHubAuthService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = config.github.clientId
    this.clientSecret = config.github.clientSecret
    this.redirectUri = config.github.redirectUri
  }

  async authenticate(): Promise<GitHubAuthResponse> {
    try {
      // Step 1: Open GitHub OAuth URL
      const authUrl = this.buildAuthUrl()
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.redirectUri
      )

      if (result.type === 'success' && result.url) {
        // Step 2: Extract authorization code from URL
        const url = result.url
        const code = this.extractCodeFromUrl(url)
        
        if (!code) {
          return {
            success: false,
            error: { message: 'No authorization code received' }
          }
        }

        // Step 3: Exchange code for access token
        const tokenResponse = await this.exchangeCodeForToken(code)
        
        if (!tokenResponse.success || !tokenResponse.accessToken) {
          return tokenResponse
        }

        // Step 4: Get user profile
        const userResponse = await this.getUserProfile(tokenResponse.accessToken)
        
        if (!userResponse.success || !userResponse.user) {
          return userResponse
        }

        return {
          success: true,
          user: userResponse.user,
          accessToken: tokenResponse.accessToken
        }
      }

      return {
        success: false,
        error: { message: 'Authentication was cancelled' }
      }
    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return {
        success: false,
        error: { 
          message: error instanceof Error ? error.message : 'Authentication failed' 
        }
      }
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read:user user:email',
      response_type: 'code',
      state: this.generateState()
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  private extractCodeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      return urlObj.searchParams.get('code')
    } catch {
      return null
    }
  }

  private async exchangeCodeForToken(code: string): Promise<GitHubAuthResponse> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      })

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: { message: data.error_description || data.error }
        }
      }

      return {
        success: true,
        accessToken: data.access_token
      }
    } catch (error) {
      return {
        success: false,
        error: { 
          message: error instanceof Error ? error.message : 'Token exchange failed' 
        }
      }
    }
  }

  private async getUserProfile(accessToken: string): Promise<GitHubAuthResponse> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const user: GitHubUser = await response.json()

      return {
        success: true,
        user
      }
    } catch (error) {
      return {
        success: false,
        error: { 
          message: error instanceof Error ? error.message : 'Failed to get user profile' 
        }
      }
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

export const githubAuth = new GitHubAuthService() 