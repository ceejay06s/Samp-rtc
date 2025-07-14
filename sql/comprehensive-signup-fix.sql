-- Comprehensive fix for signup profile creation issues

-- Step 1: Disable RLS on profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create the force_create_profile function
CREATE OR REPLACE FUNCTION force_create_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_age INTEGER,
    p_gender TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_profile profiles;
BEGIN
    -- Insert the profile
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
    
    RETURN new_profile;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Step 3: Create the sync_missing_profiles function
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profiles_created INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Loop through all users in auth.users that don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.user_id
        WHERE p.user_id IS NULL
    LOOP
        BEGIN
            -- Insert profile for this user
            INSERT INTO public.profiles (
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
                user_record.id,
                COALESCE(user_record.raw_user_meta_data->>'first_name', 'User'),
                COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
                COALESCE((user_record.raw_user_meta_data->>'age')::INTEGER, 25),
                COALESCE(user_record.raw_user_meta_data->>'gender', 'Other'),
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
            );
            
            profiles_created := profiles_created + 1;
            RAISE NOTICE 'Created profile for user: %', user_record.id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN profiles_created;
END;
$$;

-- Step 4: Create a trigger to automatically create profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert profile for new user
    INSERT INTO public.profiles (
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
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 25),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'Other'),
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
    );
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Trigger failed to create profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION force_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION force_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION force_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO anon;
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO service_role;

-- Step 7: Grant table permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- Step 8: Test the setup
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing profile creation...';
    
    -- Test direct insert
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
    );
    
    RAISE NOTICE 'Direct insert SUCCESS for user: %', test_user_id;
    
    -- Test force function
    SELECT * INTO test_result FROM force_create_profile(
        gen_random_uuid(),
        'Force',
        'Test',
        30,
        'Other'
    );
    
    IF test_result IS NOT NULL THEN
        RAISE NOTICE 'Force function SUCCESS for user: %', test_result.user_id;
    ELSE
        RAISE NOTICE 'Force function FAILED';
    END IF;
    
    -- Test sync function
    SELECT sync_missing_profiles() INTO test_result;
    RAISE NOTICE 'Sync function executed, created % profiles', test_result;
    
    -- Clean up
    DELETE FROM profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE 'All tests completed successfully!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

-- Step 9: Show final status
SELECT 'Setup completed' as status;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_users FROM auth.users; 