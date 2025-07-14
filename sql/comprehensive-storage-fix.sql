-- Comprehensive Storage Fix
-- This script will fix all storage issues step by step

-- Step 1: Check current state
DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== STORAGE DIAGNOSIS ===';
  
  -- Check if bucket exists
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') INTO bucket_exists;
  RAISE NOTICE 'Bucket exists: %', bucket_exists;
  
  -- Check policy count
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE '%profile%';
  RAISE NOTICE 'Profile policies count: %', policy_count;
  
  RAISE NOTICE '=== END DIAGNOSIS ===';
END $$;

-- Step 2: Create bucket if it doesn't exist
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    RAISE NOTICE 'Creating profile-photos bucket...';
    
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      gen_random_uuid(), 
      'profile-photos', 
      true, 
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    );
    
    RAISE NOTICE '✓ Bucket created successfully';
  ELSE
    RAISE NOTICE '✓ Bucket already exists';
  END IF;
END $$;

-- Step 3: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- Step 4: Create all required policies
DO $$
BEGIN
  RAISE NOTICE 'Creating storage policies...';
  
  -- Upload policy
  CREATE POLICY "Users can upload their own profile photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = split_part(name, '/', 1)
  );
  RAISE NOTICE '✓ Upload policy created';
  
  -- View policy
  CREATE POLICY "Users can view all profile photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-photos'
  );
  RAISE NOTICE '✓ View policy created';
  
  -- Update policy
  CREATE POLICY "Users can update their own profile photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = split_part(name, '/', 1)
  );
  RAISE NOTICE '✓ Update policy created';
  
  -- Delete policy
  CREATE POLICY "Users can delete their own profile photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = split_part(name, '/', 1)
  );
  RAISE NOTICE '✓ Delete policy created';
END $$;

-- Step 5: Test the setup
DO $$
DECLARE
  test_user_id UUID;
  test_file_name TEXT;
BEGIN
  RAISE NOTICE 'Testing the setup...';
  
  -- Get current user ID
  test_user_id := auth.uid();
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠ Not authenticated - cannot test upload';
  ELSE
    test_file_name := test_user_id::text || '/test-' || extract(epoch from now())::text || '.txt';
    
    -- Test upload
    BEGIN
      INSERT INTO storage.objects (bucket_id, name, owner, metadata)
      VALUES (
        'profile-photos',
        test_file_name,
        test_user_id,
        '{"size": 100, "mimetype": "text/plain"}'::jsonb
      );
      RAISE NOTICE '✓ Upload test successful';
      
      -- Clean up
      DELETE FROM storage.objects 
      WHERE bucket_id = 'profile-photos' AND name = test_file_name;
      RAISE NOTICE '✓ Cleanup successful';
      
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '✗ Upload test failed: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 6: Final verification
SELECT 
  'FINAL STATUS' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photos') > 0 THEN '✓'
    ELSE '✗'
  END as bucket_exists,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%profile%') >= 4 THEN '✓'
    ELSE '✗'
  END as policies_exist,
  'Test in your app now' as next_step; 