-- Create the missing sync_missing_profiles function
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
                email,
                full_name,
                avatar_url,
                created_at,
                updated_at
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
                COALESCE(user_record.raw_user_meta_data->>'avatar_url', ''),
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO anon;
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO service_role;

-- Test the function
SELECT sync_missing_profiles() as profiles_created;

-- Verify the function exists
SELECT 'Sync function created' as status, routine_name 
FROM information_schema.routines 
WHERE routine_name = 'sync_missing_profiles'; 