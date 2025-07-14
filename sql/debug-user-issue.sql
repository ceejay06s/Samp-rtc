-- Debug script for foreign key constraint issue
-- Run this in your Supabase SQL editor to check user existence

-- Check if the specific user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE id = '4c8ab199-efa5-4bfc-b169-3da27c955757';

-- Check recent users in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any profiles with non-existent users
SELECT 
  p.user_id,
  p.first_name,
  p.created_at,
  CASE 
    WHEN u.id IS NULL THEN 'MISSING USER'
    ELSE 'USER EXISTS'
  END as user_status
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Check the foreign key constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
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

-- Check if the trigger is working properly
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test creating a user manually in auth.users (if needed)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   '4c8ab199-efa5-4bfc-b169-3da27c955757'::UUID,
--   'test@example.com',
--   crypt('password', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- Check if the user creation is being rolled back
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'users' 
  AND schemaname = 'auth'
ORDER BY n_distinct DESC; 