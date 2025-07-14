-- Update simple_create_profile function to use birthdate instead of age
-- Run this in your Supabase SQL editor

-- Drop the old function
DROP FUNCTION IF EXISTS simple_create_profile(UUID, TEXT, TEXT, INTEGER, TEXT);

-- Create the new function with birthdate parameter
CREATE OR REPLACE FUNCTION simple_create_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_birthdate DATE,
  p_gender TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  birthdate DATE,
  gender TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  photos TEXT[],
  interests TEXT[],
  looking_for TEXT[],
  max_distance INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  is_online BOOLEAN,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Insert the profile
  INSERT INTO profiles (
    user_id,
    first_name,
    last_name,
    birthdate,
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
    p_birthdate,
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
  );

  -- Return the created profile
  RETURN QUERY
  SELECT 
    profiles.id,
    profiles.user_id,
    profiles.first_name,
    profiles.last_name,
    profiles.bio,
    profiles.birthdate,
    profiles.gender,
    profiles.location,
    profiles.latitude,
    profiles.longitude,
    profiles.photos,
    profiles.interests,
    profiles.looking_for,
    profiles.max_distance,
    profiles.min_age,
    profiles.max_age,
    profiles.is_online,
    profiles.last_seen,
    profiles.created_at,
    profiles.updated_at
  FROM profiles
  WHERE profiles.user_id = p_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in simple_create_profile: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, DATE, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION simple_create_profile(UUID, TEXT, TEXT, DATE, TEXT) TO service_role; 