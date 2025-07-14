-- Test Profile Photos Bucket Connection
-- Run this to test if the bucket is accessible and working

-- Test 1: Basic bucket access
SELECT 
  'Test 1: Basic Access' as test_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') THEN '✓ Bucket found in storage.buckets'
    ELSE '✗ Bucket not found in storage.buckets'
  END as result;

-- Test 2: Try to list files in the bucket
DO $$
DECLARE
  file_count INTEGER;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO file_count 
    FROM storage.objects 
    WHERE bucket_id = 'profile-photos';
    
    RAISE NOTICE 'Test 2: Can list files in bucket - Found % files', file_count;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 2: Cannot list files in bucket - Error: %', SQLERRM;
  END;
END $$;

-- Test 3: Check bucket configuration
SELECT 
  'Test 3: Bucket Config' as test_name,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

-- Test 4: Check if we can create a test file (simulate upload)
DO $$
DECLARE
  test_file_name TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  test_file_name := current_user_id::text || '/test-' || extract(epoch from now())::text || '.txt';
  
  BEGIN
    -- Try to insert a test record (this simulates what happens during upload)
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'profile-photos',
      test_file_name,
      current_user_id,
      '{"size": 100, "mimetype": "text/plain"}'::jsonb
    );
    
    RAISE NOTICE 'Test 4: Can create test file - Success';
    
    -- Clean up the test file
    DELETE FROM storage.objects 
    WHERE bucket_id = 'profile-photos' AND name = test_file_name;
    
    RAISE NOTICE 'Test 4: Test file cleaned up';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 4: Cannot create test file - Error: %', SQLERRM;
  END;
END $$;

-- Test 5: Check policies
SELECT 
  'Test 5: Policies' as test_name,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%profile%'
ORDER BY policyname; 