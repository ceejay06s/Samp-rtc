-- Simple Supabase Storage Setup for Profile Photos
-- Run this in your Supabase SQL editor

-- Storage policies for the profile-photos bucket
-- Note: Create the bucket manually in the Supabase dashboard first

-- Allow users to upload their own profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Allow users to view all profile photos (for discovery)
CREATE POLICY "Users can view all profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow users to update their own profile photos
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Allow users to delete their own profile photos
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Function to get user's photo count
CREATE OR REPLACE FUNCTION get_user_photo_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM storage.objects
    WHERE bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = user_uuid::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate photo upload
CREATE OR REPLACE FUNCTION validate_photo_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has less than 6 photos
  IF get_user_photo_count(auth.uid()) >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 photos allowed per user';
  END IF;
  
  -- Check file size (10MB limit)
  IF NEW.metadata->>'size'::text::bigint > 10485760 THEN
    RAISE EXCEPTION 'File size must be less than 10MB';
  END IF;
  
  -- Check file type
  IF NEW.metadata->>'mimetype' NOT LIKE 'image/%' THEN
    RAISE EXCEPTION 'Only image files are allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate photo uploads
DROP TRIGGER IF EXISTS validate_photo_upload_trigger ON storage.objects;
CREATE TRIGGER validate_photo_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'profile-photos')
  EXECUTE FUNCTION validate_photo_upload();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_photo_count(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_user_photo_count(UUID) IS 'Get the number of photos uploaded by a user';
COMMENT ON FUNCTION validate_photo_upload() IS 'Validate photo uploads (file size, type, count)'; 