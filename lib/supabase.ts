import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Create Supabase client with config values
export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Export a function to validate config when needed
export function validateSupabaseConfig() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
} 