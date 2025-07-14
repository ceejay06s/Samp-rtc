-- Setup Supabase Storage Bucket for Profile Photos
-- Run this in your Supabase SQL editor

-- Create the storage bucket for profile photos
-- Note: This needs to be done through the Supabase dashboard or API
-- The bucket should be named 'profile-photos' and set as public

-- Storage policies for the profile-photos bucket

-- Allow users to upload their own profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow users to view all profile photos (for discovery)
CREATE POLICY "Users can view all profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow users to update their own profile photos
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow users to delete their own profile photos
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Function to clean up orphaned photos when a user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_photos()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all photos for the deleted user
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-photos' 
  AND (string_to_array(name, '/'))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to clean up photos when a user is deleted
DROP TRIGGER IF EXISTS cleanup_photos_on_user_delete ON auth.users;
CREATE TRIGGER cleanup_photos_on_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION cleanup_user_photos();

-- Function to get user's photo count
CREATE OR REPLACE FUNCTION get_user_photo_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM storage.objects
    WHERE bucket_id = 'profile-photos'
    AND (string_to_array(name, '/'))[1] = user_uuid::text
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

-- Function to get user's photos with metadata
CREATE OR REPLACE FUNCTION get_user_photos(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  url TEXT,
  size BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    storage.get_public_url('profile-photos', o.name) as url,
    (o.metadata->>'size')::bigint as size,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'profile-photos'
  AND (string_to_array(o.name, '/'))[1] = user_uuid::text
  ORDER BY o.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_photo_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_photos(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_user_photo_count(UUID) IS 'Get the number of photos uploaded by a user';
COMMENT ON FUNCTION get_user_photos(UUID) IS 'Get all photos uploaded by a user with metadata';
COMMENT ON FUNCTION validate_photo_upload() IS 'Validate photo uploads (file size, type, count)';
COMMENT ON FUNCTION cleanup_user_photos() IS 'Clean up user photos when account is deleted'; 