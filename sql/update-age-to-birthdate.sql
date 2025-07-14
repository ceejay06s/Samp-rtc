-- Migration: Update profiles table to use birthdate instead of age
-- Run this in your Supabase SQL editor

-- Add birthdate column
ALTER TABLE profiles ADD COLUMN birthdate DATE;

-- Update existing profiles with a default birthdate (calculate from current age)
-- This assumes users are 25 years old as a default
UPDATE profiles 
SET birthdate = DATE_TRUNC('year', NOW()) - INTERVAL '25 years'
WHERE birthdate IS NULL;

-- Make birthdate NOT NULL after setting default values
ALTER TABLE profiles ALTER COLUMN birthdate SET NOT NULL;

-- Remove the age column
ALTER TABLE profiles DROP COLUMN age;

-- Update the age index to use birthdate
DROP INDEX IF EXISTS idx_profiles_age;
CREATE INDEX idx_profiles_birthdate ON profiles(birthdate);

-- Create a function to calculate age from birthdate
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view that includes calculated age for backward compatibility
CREATE OR REPLACE VIEW profiles_with_age AS
SELECT 
  *,
  calculate_age(birthdate) as age
FROM profiles;

-- Update RLS policies to work with the new structure
-- (The existing policies should still work as they reference user_id, not age)

-- Add a check constraint to ensure birthdate is reasonable (user must be at least 18)
ALTER TABLE profiles ADD CONSTRAINT check_birthdate_reasonable 
  CHECK (birthdate <= CURRENT_DATE - INTERVAL '18 years');

-- Add a check constraint to ensure birthdate is not in the future
ALTER TABLE profiles ADD CONSTRAINT check_birthdate_not_future 
  CHECK (birthdate <= CURRENT_DATE); 