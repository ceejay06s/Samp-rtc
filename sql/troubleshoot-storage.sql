-- Troubleshoot Supabase Storage Issues
-- Run this in your Supabase SQL editor to diagnose storage problems

-- 1. Check if the profile-photos bucket exists and its configuration
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'profile-photos';

-- 2. If bucket doesn't exist, create it (run this manually if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (gen_random_uuid(), 'profile-photos', true, 10485760, ARRAY['image/*']);

-- 3. Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 5. Check storage permissions for authenticated users
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
AND grantee = 'authenticated';

-- 6. Test storage access (this will show if there are permission issues)
-- Note: This is a diagnostic query, not an actual upload
SELECT 
  'Storage bucket accessible' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') 
    THEN 'YES' 
    ELSE 'NO' 
  END as bucket_exists,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND policyname LIKE '%profile%'
    ) 
    THEN 'YES' 
    ELSE 'NO' 
  END as policies_exist;

-- 7. Check for any existing files in the bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
ORDER BY created_at DESC
LIMIT 10;

-- 8. Summary of issues and fixes
SELECT 
  'TROUBLESHOOTING SUMMARY' as section,
  'Check the results above and ensure:' as instructions,
  '1. profile-photos bucket exists and is public' as check1,
  '2. Storage policies are properly configured' as check2,
  '3. RLS is enabled on storage.objects' as check3,
  '4. Authenticated users have proper permissions' as check4; 