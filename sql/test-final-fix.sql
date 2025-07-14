-- Test Final Signup Fix
-- Run this in your Supabase SQL editor to verify the fix works

-- Test 1: Check if RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Test 2: Check if foreign key constraint is dropped
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles'
  AND kcu.column_name = 'user_id';

-- Test 3: Check if the force create function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'force_create_profile';

-- Test 4: Check if the simple trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'simple_auth_user_created';

-- Test 5: Check if the sync function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'sync_missing_profiles';

-- Test 6: Test the force create function with a dummy user ID
SELECT force_create_profile(
  '00000000-0000-0000-0000-000000000888'::UUID,
  'Test',
  'Force',
  30,
  'Other'
);

-- Test 7: Verify the test profile was created
SELECT * FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000888'::UUID;

-- Test 8: Test direct insert (should work without constraints)
INSERT INTO profiles (
  user_id,
  first_name,
  last_name,
  age,
  gender
) VALUES (
  '00000000-0000-0000-0000-000000000777'::UUID,
  'Direct',
  'Insert',
  25,
  'Other'
) ON CONFLICT (user_id) DO NOTHING;

-- Test 9: Verify the direct insert worked
SELECT * FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000777'::UUID;

-- Test 10: Check current policies (should be very permissive)
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

-- Test 11: Clean up test data
DELETE FROM profiles WHERE user_id IN (
  '00000000-0000-0000-0000-000000000888'::UUID,
  '00000000-0000-0000-0000-000000000777'::UUID
);

-- Test 12: Verify cleanup
SELECT COUNT(*) as remaining_test_profiles 
FROM profiles 
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000888'::UUID,
  '00000000-0000-0000-0000-000000000777'::UUID
); 