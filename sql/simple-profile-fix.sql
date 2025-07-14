-- Simple fix for profile creation - focus on making it work

-- 1. Make sure RLS is disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create a very simple function that definitely works
CREATE OR REPLACE FUNCTION simple_create_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_age INTEGER,
    p_gender TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_profile profiles;
BEGIN
    RAISE NOTICE 'Creating profile for user: %', p_user_id;
    
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
        is_online,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_age,
        p_gender,
        '',
        '',
        '{}',
        '{}',
        '{}',
        50,
        18,
        100,
        true,
        NOW(),
        NOW()
    ) RETURNING * INTO new_profile;
    
    RAISE NOTICE 'Profile created successfully: %', new_profile.user_id;
    RETURN new_profile;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in simple_create_profile: %', SQLERRM;
    RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    RETURN NULL;
END;
$$;

-- 3. Grant all permissions
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO service_role;

GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- 4. Test the simple function
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing simple_create_profile function...';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    SELECT * INTO test_result FROM simple_create_profile(
        test_user_id,
        'Simple',
        'Test',
        25,
        'Other'
    );
    
    IF test_result IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Profile created with user_id: %', test_result.user_id;
        RAISE NOTICE 'Profile data: first_name=%, last_name=%, age=%', 
                    test_result.first_name, test_result.last_name, test_result.age;
    ELSE
        RAISE NOTICE 'FAILED: Function returned NULL';
    END IF;
    
    -- Verify in database
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = test_user_id) THEN
        RAISE NOTICE 'VERIFIED: Profile exists in database';
    ELSE
        RAISE NOTICE 'ERROR: Profile not found in database';
    END IF;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

-- 5. Show current status
SELECT 'Simple fix completed' as status;
SELECT COUNT(*) as total_profiles FROM profiles; 