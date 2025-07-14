-- Fix Storage Schema Lock Issues
-- Run this to diagnose and fix storage schema problems

-- Step 1: Check if storage extension is properly installed
SELECT 
  'Storage Extension Check' as check_type,
  extname as extension_name,
  extversion as version,
  extrelocatable as relocatable,
  CASE 
    WHEN extname = 'storage' THEN '✓ Storage extension found'
    ELSE '✗ Storage extension not found'
  END as status
FROM pg_extension 
WHERE extname = 'storage';

-- Step 2: Check storage schema permissions
SELECT 
  'Storage Schema Permissions' as check_type,
  nspname as schema_name,
  nspowner::regrole as owner,
  nspacl as permissions,
  CASE 
    WHEN nspname = 'storage' THEN '✓ Storage schema exists'
    ELSE 'Other schema'
  END as status
FROM pg_namespace 
WHERE nspname = 'storage';

-- Step 3: Check if we can access storage tables
SELECT 
  'Storage Tables Access' as check_type,
  schemaname,
  tablename,
  tableowner,
  CASE 
    WHEN schemaname = 'storage' THEN '✓ Storage table accessible'
    ELSE 'Other table'
  END as status
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Step 4: Check storage buckets table specifically
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
    RAISE NOTICE '✓ Can access storage.buckets - Found % buckets', bucket_count;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Cannot access storage.buckets: %', SQLERRM;
  END;
END $$;

-- Step 5: Check storage objects table
DO $$
DECLARE
  object_count INTEGER;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO object_count FROM storage.objects;
    RAISE NOTICE '✓ Can access storage.objects - Found % objects', object_count;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Cannot access storage.objects: %', SQLERRM;
  END;
END $$;

-- Step 6: Try to create a test bucket (if we have permissions)
DO $$
DECLARE
  test_bucket_name TEXT;
  bucket_exists BOOLEAN;
BEGIN
  test_bucket_name := 'test-bucket-' || extract(epoch from now())::text;
  
  -- Check if test bucket already exists
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = test_bucket_name) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '⚠ Test bucket already exists, skipping creation';
  ELSE
    BEGIN
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        gen_random_uuid(), 
        test_bucket_name, 
        true, 
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/jpg']
      );
      
      RAISE NOTICE '✓ Successfully created test bucket: %', test_bucket_name;
      
      -- Clean up test bucket
      DELETE FROM storage.buckets WHERE name = test_bucket_name;
      RAISE NOTICE '✓ Test bucket cleaned up';
      
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '✗ Cannot create test bucket: %', SQLERRM;
        RAISE NOTICE 'This indicates a storage schema lock or permission issue';
    END;
  END IF;
END $$;

-- Step 7: Check for any locks on storage schema
SELECT 
  'Storage Schema Locks' as check_type,
  l.pid,
  l.mode,
  l.granted,
  l.locktype,
  l.database,
  l.relation::regclass as table_name,
  l.page,
  l.tuple,
  l.virtualxid,
  l.transactionid,
  l.classid::regclass as class_name,
  l.objid,
  l.objsubid,
  l.virtualtransaction
FROM pg_locks l
JOIN pg_database d ON l.database = d.oid
WHERE d.datname = current_database()
  AND (l.relation::regclass::text LIKE '%storage%' OR l.classid::regclass::text LIKE '%storage%')
ORDER BY l.pid;

-- Step 8: Check current user permissions
SELECT 
  'Current User Permissions' as check_type,
  current_user as username,
  session_user as session_username,
  current_database() as database_name,
  current_schema as current_schema_name,
  CASE 
    WHEN current_user = 'postgres' THEN '✓ Admin user'
    WHEN current_user LIKE '%service_role%' THEN '✓ Service role'
    WHEN current_user LIKE '%anon%' THEN '⚠ Anonymous user'
    ELSE '⚠ Regular user'
  END as user_type; 