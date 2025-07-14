-- Fix User ID Relationship Issue
-- Run this in your Supabase SQL editor to fix the foreign key constraint issue

-- Step 1: Check current foreign key constraint
SELECT 'Current foreign key constraint:' as info;
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

-- Step 2: Drop existing foreign key constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 3: Recreate the foreign key constraint with proper references
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- Step 4: Create a function to safely create profiles with proper user verification
CREATE OR REPLACE FUNCTION create_profile_safe_with_user_check(
  p_user_id UUID,
  p_first_name TEXT DEFAULT 'User',
  p_last_name TEXT DEFAULT '',
  p_age INTEGER DEFAULT 18,
  p_gender TEXT DEFAULT 'Other'
) RETURNS profiles AS $$
DECLARE
  new_profile profiles;
  user_exists BOOLEAN;
BEGIN
  -- First, verify the user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist in auth.users table', p_user_id;
  END IF;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user_id) THEN
    -- Update existing profile
    UPDATE profiles SET
      first_name = p_first_name,
      last_name = p_last_name,
      age = p_age,
      gender = p_gender,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO new_profile;
  ELSE
    -- Create new profile
    INSERT INTO profiles (
      id,
      user_id,
      first_name,
      last_name,
      bio,
      age,
      gender,
      location,
      latitude,
      longitude,
      photos,
      interests,
      looking_for,
      max_distance,
      min_age,
      max_age,
      is_online,
      last_seen,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_user_id,
      p_first_name,
      p_last_name,
      '',
      p_age,
      p_gender,
      '',
      NULL,
      NULL,
      '{}',
      '{}',
      '{}',
      50,
      18,
      100,
      true,
      NOW(),
      NOW(),
      NOW()
    ) RETURNING * INTO new_profile;
  END IF;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION create_profile_safe_with_user_check(UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_safe_with_user_check(UUID, TEXT, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_profile_safe_with_user_check(UUID, TEXT, TEXT, INTEGER, TEXT) TO service_role;

-- Step 6: Create a trigger function that waits for user to be committed
CREATE OR REPLACE FUNCTION handle_new_user_with_commit_check()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
  retry_count INTEGER := 0;
  max_retries INTEGER := 10;
BEGIN
  -- Wait for user to be committed to auth.users
  WHILE retry_count < max_retries LOOP
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;
    
    IF user_exists THEN
      -- User exists, create profile
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
        BEGIN
          INSERT INTO profiles (
            id,
            user_id,
            first_name,
            last_name,
            bio,
            age,
            gender,
            location,
            latitude,
            longitude,
            photos,
            interests,
            looking_for,
            max_distance,
            min_age,
            max_age,
            is_online,
            last_seen,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            NEW.id,
            'User',
            '',
            '',
            18,
            'Other',
            '',
            NULL,
            NULL,
            '{}',
            '{}',
            '{}',
            50,
            18,
            100,
            true,
            NOW(),
            NOW(),
            NOW()
          );
          
          RAISE NOTICE 'Profile created successfully for user %', NEW.id;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
        END;
      END IF;
      EXIT; -- Exit the retry loop
    ELSE
      -- User doesn't exist yet, wait and retry
      retry_count := retry_count + 1;
      PERFORM pg_sleep(0.2 * retry_count); -- Exponential backoff
      RAISE NOTICE 'User % not found, retry % of %', NEW.id, retry_count, max_retries;
    END IF;
  END LOOP;
  
  IF retry_count >= max_retries THEN
    RAISE NOTICE 'Failed to create profile for user % after % retries', NEW.id, max_retries;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_robust ON auth.users;
CREATE TRIGGER on_auth_user_created_with_commit_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_commit_check();

-- Step 8: Verify the setup
SELECT 'Foreign key constraint updated' as status;
SELECT 'Safe profile creation function created' as status, routine_name FROM information_schema.routines WHERE routine_name = 'create_profile_safe_with_user_check';
SELECT 'Commit check trigger created' as status, trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_with_commit_check'; 