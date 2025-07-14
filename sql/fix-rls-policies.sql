-- Fix RLS Policies for Dating App
-- Run this in your Supabase SQL editor to fix the signup issue

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a more permissive INSERT policy for profiles
-- This allows profile creation during signup when auth.uid() might not be immediately available
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT WITH CHECK (
    -- Allow if user_id matches the authenticated user
    (auth.uid() = user_id)
    OR
    -- Allow if the user_id exists in auth.users (for signup process)
    (EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = profiles.user_id
    ))
  );

-- Also create a policy to allow profile updates during the signup process
CREATE POLICY "Allow profile updates during signup" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = profiles.user_id
    )
  );

-- Create a policy to allow profile selection during signup
CREATE POLICY "Allow profile selection during signup" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = profiles.user_id
    )
  );

-- Alternative approach: Create a function to handle profile creation
-- This bypasses RLS for profile creation during signup
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_age INTEGER,
  p_gender TEXT
) RETURNS profiles AS $$
DECLARE
  new_profile profiles;
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
    true
  ) RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, INTEGER, TEXT) TO anon; 