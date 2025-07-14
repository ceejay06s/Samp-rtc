-- Test script to verify signup functionality
-- Run this in your Supabase SQL editor to test the signup process

-- Test 1: Check if the trigger function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test 2: Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- Test 4: Check if the create_user_profile function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'create_user_profile';

-- Test 5: Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position; 