-- Check Foreign Key Constraint Relationship
-- Run this in your Supabase SQL editor to understand the constraint

-- Check the current foreign key constraint
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

-- Check the profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'user_id'
ORDER BY ordinal_position;

-- Check the auth.users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'auth'
  AND table_name = 'users' 
  AND column_name = 'id'
ORDER BY ordinal_position;

-- Check if there are any data type mismatches
SELECT 
  'profiles.user_id' as column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'user_id'
UNION ALL
SELECT 
  'auth.users.id' as column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'auth'
  AND table_name = 'users' 
  AND column_name = 'id';

-- Check recent users in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if the specific user exists
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE id = '4c8ab199-efa5-4bfc-b169-3da27c955757';

-- Check profiles table for any orphaned records
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
WHERE u.id IS NULL
ORDER BY p.created_at DESC; 