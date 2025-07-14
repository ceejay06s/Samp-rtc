-- Check All Storage Buckets
-- Run this to see what buckets are actually available

-- List all buckets in the storage schema
SELECT 
  'All Buckets' as check_type,
  id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- Check if we can access storage schema at all
SELECT 
  'Storage Schema Access' as check_type,
  schemaname,
  tablename,
  tableowner,
  CASE 
    WHEN schemaname = 'storage' THEN '✓ Storage schema accessible'
    ELSE 'Other schema'
  END as status
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Check storage permissions
SELECT 
  'Storage Permissions' as check_type,
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'storage'
ORDER BY table_name, privilege_type; 