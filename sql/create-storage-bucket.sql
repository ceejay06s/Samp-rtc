-- Create Storage Bucket for Profile Photos
-- Run this in your Supabase SQL editor if the bucket doesn't exist

-- Check if bucket exists first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'profile-photo') THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'profile-photo', -- Use bucket name as ID (same as manual creation)
      'profile-photo', 
      true, 
      52428800, -- 50MB limit (50 * 1024 * 1024)
      ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    );
    
    RAISE NOTICE 'Storage bucket "profile-photo" created successfully';
  ELSE
    RAISE NOTICE 'Storage bucket "profile-photo" already exists';
  END IF;
END $$;

-- Verify the bucket was created
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'profile-photo';

-- Create basic storage policies if they don't exist
DO $$
BEGIN
  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload their own profile photos'
  ) THEN
    CREATE POLICY "Users can upload their own profile photos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'profile-photo' AND
      auth.uid()::text = split_part(name, '/', 1)
    );
    RAISE NOTICE 'Upload policy created';
  END IF;

  -- View policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can view all profile photos'
  ) THEN
    CREATE POLICY "Users can view all profile photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-photo');
    RAISE NOTICE 'View policy created';
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can update their own profile photos'
  ) THEN
    CREATE POLICY "Users can update their own profile photos" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'profile-photo' AND
      auth.uid()::text = split_part(name, '/', 1)
    );
    RAISE NOTICE 'Update policy created';
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete their own profile photos'
  ) THEN
    CREATE POLICY "Users can delete their own profile photos" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'profile-photo' AND
      auth.uid()::text = split_part(name, '/', 1)
    );
    RAISE NOTICE 'Delete policy created';
  END IF;
END $$;

-- Final verification
SELECT 
  'Storage Setup Complete' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photo') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%profile%') as policies_count; 