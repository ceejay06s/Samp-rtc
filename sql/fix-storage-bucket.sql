-- Fix Supabase Storage Bucket Connection (Simplified)
-- Run this in your Supabase SQL editor to properly set up storage

-- Step 1: Create the profile-photos bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'profile-photos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      gen_random_uuid(), 
      'profile-photos', 
      true, 
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    );
    RAISE NOTICE 'Storage bucket "profile-photos" created successfully';
  ELSE
    RAISE NOTICE 'Storage bucket "profile-photos" already exists';
  END IF;
END $$;

-- Step 2: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- Step 3: Create proper storage policies
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

-- Step 4: Verify setup
SELECT 
  'Storage Setup Complete' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-photos') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%profile%') as policies_count;

-- Step 5: Test bucket access
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos'; 