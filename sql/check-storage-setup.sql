-- Check Current Storage Setup
-- Run this in your Supabase SQL editor to see what's already configured

-- Check if the profile-photos bucket exists
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

-- Check existing storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%profile%';

-- Check existing functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_photo_count', 'validate_photo_upload');

-- Check existing triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%photo%';

-- Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Summary
SELECT 
  'Storage Setup Check Complete' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photos') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%profile%') as policies_count,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('get_user_photo_count', 'validate_photo_upload')) as functions_count; 