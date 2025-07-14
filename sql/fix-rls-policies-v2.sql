-- Fix RLS Policies for Dating App - Version 2
-- Run this in your Supabase SQL editor to fix the signup issue

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates during signup" ON profiles;
DROP POLICY IF EXISTS "Allow profile selection during signup" ON profiles;

-- Create a simple, permissive INSERT policy for profiles
-- This allows profile creation during signup without referencing auth.users
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (
    -- Allow if user_id matches the authenticated user
    auth.uid() = user_id
    OR
    -- Allow if no user is authenticated (for signup process)
    auth.uid() IS NULL
  );

-- Create a simple UPDATE policy for profiles
CREATE POLICY "Allow profile updates" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Create a simple SELECT policy for profiles
CREATE POLICY "Allow profile selection" ON profiles
  FOR SELECT USING (
    -- Users can view their own profile
    auth.uid() = user_id
    OR
    -- Users can view other profiles for discovery (when authenticated)
    (auth.uid() IS NOT NULL AND auth.uid() != user_id)
  );

-- Create the profile creation function (more reliable approach)
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

-- Alternative: Create a trigger-based approach
-- This automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
    NEW.id,
    'User',  -- Default first name
    '',      -- Default last name
    18,      -- Default age
    'Other', -- Default gender
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 