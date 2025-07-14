-- Comprehensive diagnostic script for signup profile creation issues

-- 1. Check if all required functions exist
SELECT 'Checking functions...' as status;

SELECT 'force_create_profile function' as function_name, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'force_create_profile'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'sync_missing_profiles function' as function_name, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines 
         WHERE routine_name = 'sync_missing_profiles'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check profiles table structure
SELECT 'Checking profiles table...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. Check RLS policies on profiles table
SELECT 'Checking RLS policies...' as status;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Check if RLS is enabled on profiles table
SELECT 'Checking RLS status...' as status;

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 5. Check triggers on profiles table
SELECT 'Checking triggers...' as status;

SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 6. Check foreign key constraints
SELECT 'Checking foreign keys...' as status;

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'profiles';

-- 7. Check current user permissions
SELECT 'Checking current user permissions...' as status;

SELECT current_user as current_user;
SELECT session_user as session_user;

-- 8. Test if we can insert into profiles directly
SELECT 'Testing direct insert...' as status;

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    insert_result RECORD;
BEGIN
    -- Try to insert a test profile
    INSERT INTO profiles (
        user_id, 
        first_name, 
        last_name, 
        age, 
        gender,
        bio,
        location,
        photos,
        interests,
        looking_for,
        max_distance,
        min_age,
        max_age,
        is_online
    ) VALUES (
        test_user_id,
        'Test',
        'User',
        25,
        'Other',
        '',
        '',
        '{}',
        '{}',
        '{}',
        50,
        18,
        100,
        true
    ) RETURNING * INTO insert_result;
    
    RAISE NOTICE 'Direct insert SUCCESS: %', insert_result.user_id;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Direct insert FAILED: %', SQLERRM;
END $$;

-- 9. Check if auth.users table is accessible
SELECT 'Checking auth.users access...' as status;

SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 10. Check recent signups (if any)
SELECT 'Checking recent users...' as status;

SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 11. Check if any profiles exist
SELECT 'Checking existing profiles...' as status;

SELECT COUNT(*) as total_profiles FROM profiles;

-- 12. Check for orphaned users (users without profiles)
SELECT 'Checking orphaned users...' as status;

SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL; 