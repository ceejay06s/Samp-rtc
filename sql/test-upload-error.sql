-- Test Upload Error Details
-- Run this to see exactly what permission error you're getting

-- Test 1: Check if user is authenticated
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  RAISE NOTICE '=== AUTHENTICATION CHECK ===';
  RAISE NOTICE 'User ID: %', current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '✗ User is not authenticated';
  ELSE
    RAISE NOTICE '✓ User is authenticated';
  END IF;
END $$;

-- Test 2: Check bucket access
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') INTO bucket_exists;
  SELECT public FROM storage.buckets WHERE name = 'profile-photos' INTO bucket_public;
  
  RAISE NOTICE '=== BUCKET ACCESS CHECK ===';
  RAISE NOTICE 'Bucket exists: %', bucket_exists;
  RAISE NOTICE 'Bucket is public: %', bucket_public;
  
  IF bucket_exists THEN
    RAISE NOTICE '✓ Bucket is accessible';
  ELSE
    RAISE NOTICE '✗ Bucket not found';
  END IF;
END $$;

-- Test 3: Check upload policies
SELECT 
  '=== UPLOAD POLICIES CHECK ===' as check_type,
  policyname,
  cmd as operation,
  roles,
  qual as condition
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Test 4: Try to upload a test file and capture the exact error
DO $$
DECLARE
  current_user_id UUID;
  test_file_name TEXT;
  error_message TEXT;
  error_detail TEXT;
  error_hint TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠ Cannot test upload - user not authenticated';
    RETURN;
  END IF;
  
  test_file_name := current_user_id::text || '/test-error-' || extract(epoch from now())::text || '.txt';
  
  RAISE NOTICE '=== UPLOAD TEST ===';
  RAISE NOTICE 'Testing upload with file: %', test_file_name;
  
  BEGIN
    -- Try to upload
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'profile-photos',
      test_file_name,
      current_user_id,
      '{"size": 100, "mimetype": "text/plain"}'::jsonb
    );
    
    RAISE NOTICE '✓ Upload successful!';
    
    -- Clean up
    DELETE FROM storage.objects 
    WHERE bucket_id = 'profile-photos' AND name = test_file_name;
    
    RAISE NOTICE '✓ Test file cleaned up';
    
  EXCEPTION 
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS 
        error_message = MESSAGE_TEXT,
        error_detail = PG_EXCEPTION_DETAIL,
        error_hint = PG_EXCEPTION_HINT;
      
      RAISE NOTICE '✗ Upload failed with error:';
      RAISE NOTICE '  Error: %', error_message;
      RAISE NOTICE '  Detail: %', error_detail;
      RAISE NOTICE '  Hint: %', error_hint;
      
      -- Provide specific guidance based on error
      IF error_message LIKE '%permission%' OR error_message LIKE '%policy%' THEN
        RAISE NOTICE '  → This is a policy/permission issue';
        RAISE NOTICE '  → Run the fix-upload-permissions.sql script';
      ELSIF error_message LIKE '%bucket%' THEN
        RAISE NOTICE '  → This is a bucket access issue';
        RAISE NOTICE '  → Check if the profile-photos bucket exists';
      ELSIF error_message LIKE '%authenticated%' THEN
        RAISE NOTICE '  → This is an authentication issue';
        RAISE NOTICE '  → Make sure user is logged in';
      ELSE
        RAISE NOTICE '  → This is an unknown issue';
        RAISE NOTICE '  → Check Supabase logs for more details';
      END IF;
  END;
END $$;

-- Test 5: Check RLS status
SELECT 
  '=== RLS STATUS ===' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✓ RLS is enabled'
    ELSE '✗ RLS is disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects'; 