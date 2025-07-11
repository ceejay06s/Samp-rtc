import { createClient } from '@supabase/supabase-js'
import { config, validateConfig } from './config'

// Validate environment variables on import
validateConfig()

export const supabase = createClient(config.supabase.url, config.supabase.anonKey) 