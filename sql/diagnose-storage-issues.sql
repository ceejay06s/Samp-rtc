-- Diagnose Storage Issues
-- Run this in your Supabase SQL editor to check what's wrong with your storage setup

-- Check 1: Verify bucket exists and configuration
SELECT 
  'Bucket Check' as check_type,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN name = 'profile-photos' THEN '✓ Bucket exists'
    ELSE '✗ Bucket not found'
  END as status
FROM storage.buckets 
WHERE name = 'profile-photos';

-- Check 2: Check if RLS is enabled on storage.objects
SELECT 
  'RLS Check' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✓ RLS is enabled'
    ELSE '✗ RLS is disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check 3: List all existing policies on storage.objects
SELECT 
  'Policy Check' as check_type,
  policyname,
  permissive,
  roles,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%profile%' THEN '✓ Profile policy found'
    ELSE 'Other policy'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Check 4: Check for specific profile policies
SELECT 
  'Profile Policies Check' as check_type,
  COUNT(*) as profile_policies_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ All profile policies exist'
    WHEN COUNT(*) > 0 THEN '⚠ Some profile policies missing'
    ELSE '✗ No profile policies found'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%profile%';

-- Check 5: Test bucket access (if authenticated)
DO $$
DECLARE
  current_user_id UUID;
  test_result TEXT;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    -- Try to list files in the bucket
    BEGIN
      PERFORM 1 FROM storage.objects 
      WHERE bucket_id = 'profile-photos' 
      LIMIT 1;
      test_result := '✓ Can access bucket';
    EXCEPTION 
      WHEN OTHERS THEN
        test_result := '✗ Cannot access bucket: ' || SQLERRM;
    END;
  ELSE
    test_result := '⚠ Not authenticated - cannot test access';
  END IF;
  
  RAISE NOTICE 'Access Test: %', test_result;
END $$;

-- Check 6: Summary of issues
SELECT 
  'SUMMARY' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photos') > 0 THEN '✓'
    ELSE '✗'
  END as bucket_exists,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') = true THEN '✓'
    ELSE '✗'
  END as rls_enabled,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%profile%') >= 4 THEN '✓'
    ELSE '✗'
  END as policies_exist,
  'Run the fix script if any items show ✗' as recommendation; 