import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BucketConfig {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number;
  allowed_mime_types: string[];
}

const bucketConfigs: BucketConfig[] = [
  {
    id: 'profile-photo',
    name: 'profile-photo',
    public: true,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'telegram-stickers',
    name: 'telegram-stickers',
    public: true,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['image/webp', 'image/png', 'image/gif']
  },
  {
    id: 'user-uploads',
    name: 'user-uploads',
    public: true,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'text/plain', 'application/pdf', 'text/csv']
  },
  {
    id: 'chat-media',
    name: 'chat-media',
    public: true,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'text/plain']
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const existingBucketIds = existingBuckets?.map(bucket => bucket.id) || []
    const results: { bucket: string; status: 'created' | 'exists' | 'error'; error?: string }[] = []

    // Create buckets that don't exist
    for (const config of bucketConfigs) {
      if (existingBucketIds.includes(config.id)) {
        results.push({ bucket: config.id, status: 'exists' })
        continue
      }

      try {
        const { data, error } = await supabase.storage.createBucket(config.id, {
          public: config.public,
          fileSizeLimit: config.file_size_limit,
          allowedMimeTypes: config.allowed_mime_types
        })

        if (error) {
          results.push({ bucket: config.id, status: 'error', error: error.message })
        } else {
          results.push({ bucket: config.id, status: 'created' })
        }
      } catch (error) {
        results.push({ 
          bucket: config.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Create storage policies
    const policyResults = await createStoragePolicies(supabase)

    return new Response(
      JSON.stringify({
        success: true,
        buckets: results,
        policies: policyResults,
        message: 'Bucket creation completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function createStoragePolicies(supabase: any) {
  const policies = [
    // Profile photo policies
    {
      name: 'Profile photos are viewable by everyone',
      bucket: 'profile-photo',
      operation: 'SELECT',
      condition: "bucket_id = 'profile-photo'"
    },
    {
      name: 'Users can upload profile photos',
      bucket: 'profile-photo',
      operation: 'INSERT',
      condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can update profile photos',
      bucket: 'profile-photo',
      operation: 'UPDATE',
      condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can delete profile photos',
      bucket: 'profile-photo',
      operation: 'DELETE',
      condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'"
    },

    // Telegram stickers policies
    {
      name: 'Telegram stickers are viewable by everyone',
      bucket: 'telegram-stickers',
      operation: 'SELECT',
      condition: "bucket_id = 'telegram-stickers'"
    },
    {
      name: 'Users can upload stickers',
      bucket: 'telegram-stickers',
      operation: 'INSERT',
      condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can update stickers',
      bucket: 'telegram-stickers',
      operation: 'UPDATE',
      condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can delete stickers',
      bucket: 'telegram-stickers',
      operation: 'DELETE',
      condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'"
    },

    // User uploads policies
    {
      name: 'User uploads are viewable by everyone',
      bucket: 'user-uploads',
      operation: 'SELECT',
      condition: "bucket_id = 'user-uploads'"
    },
    {
      name: 'Users can upload files',
      bucket: 'user-uploads',
      operation: 'INSERT',
      condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can update files',
      bucket: 'user-uploads',
      operation: 'UPDATE',
      condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can delete files',
      bucket: 'user-uploads',
      operation: 'DELETE',
      condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'"
    },

    // Chat media policies
    {
      name: 'Chat media is viewable by everyone',
      bucket: 'chat-media',
      operation: 'SELECT',
      condition: "bucket_id = 'chat-media'"
    },
    {
      name: 'Users can upload chat media',
      bucket: 'chat-media',
      operation: 'INSERT',
      condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can update chat media',
      bucket: 'chat-media',
      operation: 'UPDATE',
      condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'"
    },
    {
      name: 'Users can delete chat media',
      bucket: 'chat-media',
      operation: 'DELETE',
      condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'"
    }
  ]

  const results = []

  for (const policy of policies) {
    try {
      // Check if policy already exists
      const { data: existingPolicies, error: listError } = await supabase
        .from('pg_policies')
        .select('policyname')
        .eq('tablename', 'objects')
        .eq('policyname', policy.name)

      if (listError) {
        results.push({ policy: policy.name, status: 'error', error: listError.message })
        continue
      }

      if (existingPolicies && existingPolicies.length > 0) {
        results.push({ policy: policy.name, status: 'exists' })
        continue
      }

      // Create policy using raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "${policy.name}" ON storage.objects
          FOR ${policy.operation} 
          ${policy.operation === 'INSERT' ? 'WITH CHECK' : 'USING'} (${policy.condition})
        `
      })

      if (error) {
        results.push({ policy: policy.name, status: 'error', error: error.message })
      } else {
        results.push({ policy: policy.name, status: 'created' })
      }
    } catch (error) {
      results.push({ 
        policy: policy.name, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  return results
} 