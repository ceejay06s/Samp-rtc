-- Test script for sync_missing_profiles function

-- 1. Check if function exists
SELECT 'Function exists' as status, routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_missing_profiles';

-- 2. Check function permissions
SELECT 'Function permissions' as status, 
       routine_name, 
       specific_schema,
       routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_missing_profiles';

-- 3. Check current users without profiles
SELECT 'Users without profiles' as status, COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- 4. Test the function (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'sync_missing_profiles'
    ) THEN
        RAISE NOTICE 'Function exists, testing...';
        PERFORM sync_missing_profiles();
    ELSE
        RAISE NOTICE 'Function does not exist!';
    END IF;
END $$;

-- 5. Check profiles after sync
SELECT 'Profiles after sync' as status, COUNT(*) as total_profiles
FROM public.profiles; 