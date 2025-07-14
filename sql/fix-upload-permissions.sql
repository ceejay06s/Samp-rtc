-- Fix Upload Permissions for Profile Photos
-- Run this to fix upload permission issues

-- Step 1: Check current upload policies
SELECT 
  'Current Upload Policies' as check_type,
  policyname,
  cmd as operation,
  roles,
  qual as condition
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Drop any existing upload policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;

-- Step 3: Create a proper upload policy
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Step 4: Also ensure we have the other necessary policies
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
CREATE POLICY "Users can view all profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-photos'
);

DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Step 5: Test upload permission (if authenticated)
DO $$
DECLARE
  current_user_id UUID;
  test_file_name TEXT;
  test_result TEXT;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠ Not authenticated - cannot test upload permission';
  ELSE
    test_file_name := current_user_id::text || '/test-upload-' || extract(epoch from now())::text || '.txt';
    
    RAISE NOTICE 'Testing upload permission for user: %', current_user_id;
    RAISE NOTICE 'Test file name: %', test_file_name;
    
    -- Test upload
    BEGIN
      INSERT INTO storage.objects (bucket_id, name, owner, metadata)
      VALUES (
        'profile-photos',
        test_file_name,
        current_user_id,
        '{"size": 100, "mimetype": "text/plain"}'::jsonb
      );
      
      RAISE NOTICE '✓ Upload test successful - permission granted';
      
      -- Clean up test file
      DELETE FROM storage.objects 
      WHERE bucket_id = 'profile-photos' AND name = test_file_name;
      
      RAISE NOTICE '✓ Test file cleaned up';
      
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '✗ Upload test failed: %', SQLERRM;
        RAISE NOTICE 'This indicates a permission issue that needs to be fixed';
    END;
  END IF;
END $$;

-- Step 6: Verify all policies are in place
SELECT 
  'Final Policy Check' as check_type,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN cmd = 'INSERT' THEN '✓ Upload policy'
    WHEN cmd = 'SELECT' THEN '✓ View policy'
    WHEN cmd = 'UPDATE' THEN '✓ Update policy'
    WHEN cmd = 'DELETE' THEN '✓ Delete policy'
    ELSE 'Other policy'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%profile%'
ORDER BY cmd, policyname;

-- Step 7: Check bucket configuration
SELECT 
  'Bucket Configuration' as check_type,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN name = 'profile-photos' THEN '✓ Bucket configured correctly'
    ELSE '✗ Wrong bucket name'
  END as status
FROM storage.buckets 
WHERE name = 'profile-photos'; 