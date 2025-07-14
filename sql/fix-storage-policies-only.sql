-- Fix Storage Policies Only
-- Run this if the bucket exists but policies are missing

-- Step 1: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Step 2: Create the required policies
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Allow public access to view all profile photos (for discovery)
CREATE POLICY "Users can view all profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-photos'
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Step 3: Verify policies were created
SELECT 
  'Policy Creation Complete' as status,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%profile%'
ORDER BY policyname; 