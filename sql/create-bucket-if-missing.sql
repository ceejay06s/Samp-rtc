-- Create Profile Photos Bucket (if missing)
-- Run this to create the bucket if it doesn't exist

-- Step 1: Check if bucket exists
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE name = 'profile-photos'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Bucket "profile-photos" already exists';
  ELSE
    RAISE NOTICE 'Bucket "profile-photos" does not exist - creating it...';
    
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      gen_random_uuid(), 
      'profile-photos', 
      true, 
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    );
    
    RAISE NOTICE 'Bucket "profile-photos" created successfully';
  END IF;
END $$;

-- Step 2: Verify bucket was created
SELECT 
  'Bucket Verification' as check_type,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN name = 'profile-photos' THEN '✓ Bucket exists and is accessible'
    ELSE '✗ Bucket not found'
  END as status
FROM storage.buckets 
WHERE name = 'profile-photos';

-- Step 3: If bucket exists, create policies
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE name = 'profile-photos'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Creating policies for profile-photos bucket...';
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
    
    -- Create policies
    CREATE POLICY "Users can upload their own profile photos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'profile-photos' AND
      auth.role() = 'authenticated' AND
      auth.uid()::text = split_part(name, '/', 1)
    );

    CREATE POLICY "Users can view all profile photos" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'profile-photos'
    );

    CREATE POLICY "Users can update their own profile photos" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'profile-photos' AND
      auth.uid()::text = split_part(name, '/', 1)
    );

    CREATE POLICY "Users can delete their own profile photos" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'profile-photos' AND
      auth.uid()::text = split_part(name, '/', 1)
    );
    
    RAISE NOTICE 'Policies created successfully';
  ELSE
    RAISE NOTICE 'Cannot create policies - bucket does not exist';
  END IF;
END $$;

-- Step 4: Final verification
SELECT 
  'Final Status' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photos') > 0 THEN '✓'
    ELSE '✗'
  END as bucket_exists,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%profile%') >= 4 THEN '✓'
    ELSE '✗'
  END as policies_exist,
  'Setup complete - test in your app' as next_step; 