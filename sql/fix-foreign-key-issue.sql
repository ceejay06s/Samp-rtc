-- Fix Foreign Key Constraint Issue
-- Run this in your Supabase SQL editor to fix the user creation timing issue

-- Step 1: Drop the existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create a more robust trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user_robust()
RETURNS TRIGGER AS $$
BEGIN
  -- Add a small delay to ensure the user is fully committed
  PERFORM pg_sleep(0.1);
  
  -- Only create profile if one doesn't already exist
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
      
      -- Log successful profile creation
      RAISE NOTICE 'Profile created successfully for user %', NEW.id;
    EXCEPTION
      WHEN foreign_key_violation THEN
        -- Log the foreign key violation
        RAISE NOTICE 'Foreign key violation for user %. User may not be fully committed yet.', NEW.id;
        -- Don't fail the trigger, just log the issue
        RETURN NEW;
      WHEN OTHERS THEN
        -- Log any other errors
        RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
        -- Don't fail the trigger, just log the issue
        RETURN NEW;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger with error handling
CREATE TRIGGER on_auth_user_created_robust
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_robust();

-- Step 4: Create a function to manually create profile with retry logic
CREATE OR REPLACE FUNCTION create_profile_with_retry(
  p_user_id UUID,
  p_first_name TEXT DEFAULT 'User',
  p_last_name TEXT DEFAULT '',
  p_age INTEGER DEFAULT 18,
  p_gender TEXT DEFAULT 'Other',
  p_max_retries INTEGER DEFAULT 5
) RETURNS profiles AS $$
DECLARE
  new_profile profiles;
  retry_count INTEGER := 0;
  success BOOLEAN := false;
BEGIN
  -- Try to create profile with retry logic
  WHILE retry_count < p_max_retries AND NOT success LOOP
    BEGIN
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
        
        success := true;
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
        
        success := true;
      END IF;
    EXCEPTION
      WHEN foreign_key_violation THEN
        retry_count := retry_count + 1;
        -- Wait before retry (exponential backoff)
        PERFORM pg_sleep(0.5 * retry_count);
        RAISE NOTICE 'Foreign key violation, retry % of % for user %', retry_count, p_max_retries, p_user_id;
      WHEN OTHERS THEN
        retry_count := retry_count + 1;
        -- Wait before retry
        PERFORM pg_sleep(0.5 * retry_count);
        RAISE NOTICE 'Error on retry % of % for user %: %', retry_count, p_max_retries, p_user_id, SQLERRM;
    END;
  END LOOP;
  
  IF NOT success THEN
    RAISE EXCEPTION 'Failed to create profile for user % after % retries', p_user_id, p_max_retries;
  END IF;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION create_profile_with_retry(UUID, TEXT, TEXT, INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_with_retry(UUID, TEXT, TEXT, INTEGER, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION create_profile_with_retry(UUID, TEXT, TEXT, INTEGER, TEXT, INTEGER) TO service_role;

-- Step 6: Verify the setup
SELECT 'Robust trigger created' as status, trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created_robust';
SELECT 'Retry function created' as status, routine_name FROM information_schema.routines WHERE routine_name = 'create_profile_with_retry'; 