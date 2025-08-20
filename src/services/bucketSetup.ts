import { supabase } from '../../lib/supabase';

export interface BucketSetupResult {
  success: boolean;
  buckets: BucketResult[];
  policies: PolicyResult[];
  error?: string;
}

export interface BucketResult {
  bucket: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
}

export interface PolicyResult {
  policy: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
}

export interface BucketConfig {
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
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/webm', 'text/plain']
  }
];

export class BucketSetupService {
  /**
   * Setup storage buckets only (policies must be created manually)
   */
  static async setupBucketsOnly(): Promise<BucketSetupResult> {
    try {
      console.log('Starting bucket setup (policies will need manual setup)...');

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication required for bucket setup');
        return {
          success: false,
          buckets: [],
          policies: [],
          error: 'Authentication required. Please log in.'
        };
      }

      console.log('User authenticated:', user.id);

      // Get existing buckets
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Failed to list buckets:', listError);
        return {
          success: false,
          buckets: [],
          policies: [],
          error: `Failed to list buckets: ${listError.message}`
        };
      }

      const existingBucketIds = existingBuckets?.map(bucket => bucket.id) || [];
      const bucketResults: BucketResult[] = [];

      // Create buckets that don't exist
      for (const config of bucketConfigs) {
        if (existingBucketIds.includes(config.id)) {
          console.log(`Bucket ${config.id} already exists`);
          bucketResults.push({ bucket: config.id, status: 'exists' });
          continue;
        }

        try {
          console.log(`Creating bucket: ${config.id}`);
          const { data, error } = await supabase.storage.createBucket(config.id, {
            public: config.public,
            fileSizeLimit: config.file_size_limit,
            allowedMimeTypes: config.allowed_mime_types
          });

          if (error) {
            console.error(`Failed to create bucket ${config.id}:`, error);
            bucketResults.push({ bucket: config.id, status: 'error', error: error.message });
          } else {
            console.log(`Successfully created bucket: ${config.id}`);
            bucketResults.push({ bucket: config.id, status: 'created' });
          }
        } catch (error) {
          console.error(`Error creating bucket ${config.id}:`, error);
          bucketResults.push({ 
            bucket: config.id, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Create policies using direct SQL
      const policyResults = await this.createStoragePoliciesDirect();

      const success = bucketResults.every(result => result.status !== 'error');

      return {
        success,
        buckets: bucketResults,
        policies: policyResults
      };

    } catch (error) {
      console.error('Bucket setup failed:', error);
      return {
        success: false,
        buckets: [],
        policies: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if all required buckets exist
   */
  static async checkBuckets(): Promise<{ exists: string[]; missing: string[] }> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Failed to list buckets:', error);
        return { exists: [], missing: bucketConfigs.map(config => config.id) };
      }

      const existingBucketIds = buckets?.map(bucket => bucket.id) || [];
      const requiredBucketIds = bucketConfigs.map(config => config.id);

      const exists = requiredBucketIds.filter(id => existingBucketIds.includes(id));
      const missing = requiredBucketIds.filter(id => !existingBucketIds.includes(id));

      return { exists, missing };
    } catch (error) {
      console.error('Failed to check buckets:', error);
      return { exists: [], missing: bucketConfigs.map(config => config.id) };
    }
  }

  /**
   * Get bucket configuration
   */
  static getBucketConfig(bucketId: string): BucketConfig | undefined {
    return bucketConfigs.find(config => config.id === bucketId);
  }

  /**
   * Get all bucket configurations
   */
  static getAllBucketConfigs(): BucketConfig[] {
    return [...bucketConfigs];
  }

  /**
   * Create storage policies using direct SQL (no RPC function needed)
   */
  private static async createStoragePoliciesDirect(): Promise<PolicyResult[]> {
    const policies = [
      // Profile photo policies
      { name: 'Profile photos are viewable by everyone', bucket: 'profile-photo', operation: 'SELECT', condition: "bucket_id = 'profile-photo'" },
      { name: 'Users can upload profile photos', bucket: 'profile-photo', operation: 'INSERT', condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'" },
      { name: 'Users can update profile photos', bucket: 'profile-photo', operation: 'UPDATE', condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'" },
      { name: 'Users can delete profile photos', bucket: 'profile-photo', operation: 'DELETE', condition: "bucket_id = 'profile-photo' AND auth.role() = 'authenticated'" },
      
      // Telegram stickers policies
      { name: 'Telegram stickers are viewable by everyone', bucket: 'telegram-stickers', operation: 'SELECT', condition: "bucket_id = 'telegram-stickers'" },
      { name: 'Users can upload stickers', bucket: 'telegram-stickers', operation: 'INSERT', condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'" },
      { name: 'Users can update stickers', bucket: 'telegram-stickers', operation: 'UPDATE', condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'" },
      { name: 'Users can delete stickers', bucket: 'telegram-stickers', operation: 'DELETE', condition: "bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated'" },
      
      // User uploads policies
      { name: 'User uploads are viewable by everyone', bucket: 'user-uploads', operation: 'SELECT', condition: "bucket_id = 'user-uploads'" },
      { name: 'Users can upload files', bucket: 'user-uploads', operation: 'INSERT', condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'" },
      { name: 'Users can update files', bucket: 'user-uploads', operation: 'UPDATE', condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'" },
      { name: 'Users can delete files', bucket: 'user-uploads', operation: 'DELETE', condition: "bucket_id = 'user-uploads' AND auth.role() = 'authenticated'" },
      
      // Chat media policies
      { name: 'Chat media is viewable by everyone', bucket: 'chat-media', operation: 'SELECT', condition: "bucket_id = 'chat-media'" },
      { name: 'Users can upload chat media', bucket: 'chat-media', operation: 'INSERT', condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'" },
      { name: 'Users can update chat media', bucket: 'chat-media', operation: 'UPDATE', condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'" },
      { name: 'Users can delete chat media', bucket: 'chat-media', operation: 'DELETE', condition: "bucket_id = 'chat-media' AND auth.role() = 'authenticated'" }
    ];

    const results: PolicyResult[] = [];

    for (const policy of policies) {
      try {
        console.log(`Creating policy: ${policy.name}`);
        
        // Use direct SQL to create policy
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE POLICY IF NOT EXISTS "${policy.name}" ON storage.objects
            FOR ${policy.operation} 
            ${policy.operation === 'INSERT' ? 'WITH CHECK' : 'USING'} (${policy.condition})
          `
        });

        if (error) {
          console.error(`Failed to create policy ${policy.name}:`, error);
          results.push({ policy: policy.name, status: 'error', error: error.message });
        } else {
          console.log(`Successfully created policy: ${policy.name}`);
          results.push({ policy: policy.name, status: 'created' });
        }
      } catch (error) {
        console.error(`Error creating policy ${policy.name}:`, error);
        results.push({ 
          policy: policy.name, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }
} 