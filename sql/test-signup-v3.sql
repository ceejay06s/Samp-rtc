-- Test script for RLS Fix Version 3
-- Run this in your Supabase SQL editor to verify the fix

-- Test 1: Check if RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Test 2: Check if the safe functions exist
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name IN ('create_user_profile_safe', 'handle_new_user_safe', 'manual_create_profile');

-- Test 3: Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 4: Check current policies (should be very permissive)
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

-- Test 5: Test the manual create function with a dummy user ID
-- (This will fail but shows the function works)
SELECT manual_create_profile(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'Test',
  'User',
  25,
  'Other'
);

-- Test 6: Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test 7: Check if we can insert directly (RLS should be disabled)
-- This should work if RLS is properly disabled
INSERT INTO profiles (
  user_id,
  first_name,
  last_name,
  age,
  gender
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Direct',
  'Insert',
  30,
  'Other'
) ON CONFLICT (user_id) DO NOTHING;

-- Test 8: Verify the insert worked
SELECT * FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Test 9: Clean up test data
DELETE FROM profiles WHERE user_id IN (
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID
); 