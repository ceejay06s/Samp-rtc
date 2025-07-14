-- Debug script for force_create_profile function

-- 1. Check if the function exists and its definition
SELECT 'Function definition:' as status;
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'force_create_profile';

-- 2. Check profiles table structure
SELECT 'Profiles table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. Check if RLS is disabled
SELECT 'RLS status:' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Test the function with detailed error logging
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result RECORD;
    error_message TEXT;
BEGIN
    RAISE NOTICE 'Testing force_create_profile function...';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    -- Try to call the function
    BEGIN
        SELECT * INTO test_result FROM force_create_profile(
            test_user_id,
            'Test',
            'User',
            25,
            'Other'
        );
        
        IF test_result IS NOT NULL THEN
            RAISE NOTICE 'Function returned: %', test_result;
        ELSE
            RAISE NOTICE 'Function returned NULL';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        RAISE NOTICE 'Function call failed: %', error_message;
    END;
    
    -- Check if profile was actually created
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
        RAISE NOTICE 'Profile EXISTS in database for user: %', test_user_id;
        SELECT * INTO test_result FROM profiles WHERE user_id = test_user_id;
        RAISE NOTICE 'Profile data: %', test_result;
    ELSE
        RAISE NOTICE 'Profile DOES NOT EXIST in database for user: %', test_user_id;
    END IF;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Debug script failed: %', SQLERRM;
END $$;

-- 5. Test direct insert to see if that works
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    insert_result RECORD;
BEGIN
    RAISE NOTICE 'Testing direct insert...';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    BEGIN
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
        
        RAISE NOTICE 'Direct insert SUCCESS: %', insert_result;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Direct insert FAILED: %', SQLERRM;
    END;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Direct insert test failed: %', SQLERRM;
END $$;

-- 6. Check function permissions
SELECT 'Function permissions:' as status;
SELECT routine_name, specific_schema, routine_type
FROM information_schema.routines 
WHERE routine_name = 'force_create_profile';

-- 7. Check table permissions
SELECT 'Table permissions:' as status;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles'; 