# Supabase Storage Setup Guide

This guide will help you set up and test the Supabase storage bucket for photo uploads in your dating app.

## 🎯 **Recommended Setup: Dashboard UI (Most Reliable)**

The Dashboard UI method is the most reliable way to set up storage in Supabase and avoids permission issues.

### Step 1: Create Storage Bucket via Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ Checked (for photo discovery)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*`
5. Click **Create bucket**

### Step 2: Configure Storage Policies

1. In the Storage section, click on your `profile-photos` bucket
2. Go to the **Policies** tab
3. Click **New Policy**
4. Add these policies one by one:

#### Upload Policy
- **Policy name**: `Users can upload their own profile photos`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'profile-photos' AND
auth.role() = 'authenticated' AND
auth.uid()::text = split_part(name, '/', 1)
```

#### View Policy
- **Policy name**: `Users can view all profile photos`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'profile-photos'
```

#### Update Policy
- **Policy name**: `Users can update their own profile photos`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'profile-photos' AND
auth.uid()::text = split_part(name, '/', 1)
```

#### Delete Policy
- **Policy name**: `Users can delete their own profile photos`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'profile-photos' AND
auth.uid()::text = split_part(name, '/', 1)
```

### Step 3: Test the Connection

1. Open your app and navigate to the Profile screen
2. Look for the "Test Storage Connection" button in the Photos section
3. Tap the button to run a comprehensive connection test
4. Review the test results in the alert dialog

## Alternative Setup: Minimal SQL Script

If you prefer SQL, use this simplified script that avoids permission issues:

### Step 1: Run the Minimal Storage Setup Script

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `sql/fix-storage-bucket.sql`
3. Click "Run" to execute the script

**Note**: This script only creates the bucket and policies, avoiding system table modifications that require elevated permissions.

## Manual Setup (If Both Above Methods Fail)

### Step 1: Create Storage Bucket

```sql
-- Create the profile-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  gen_random_uuid(), 
  'profile-photos', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
);
```

### Step 2: Create Access Policies

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Allow public access to view all profile photos
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
```

## Testing Your Setup

### Using the App's Test Button

1. **Navigate to Profile**: Open your app and go to the Profile screen
2. **Find Test Button**: Look for "Test Storage Connection" button in the Photos section
3. **Run Test**: Tap the button to start the comprehensive test
4. **Review Results**: The test will show you:
   - ✓ Bucket exists: Yes/No
   - ✓ Bucket accessible: Yes/No
   - ✓ Can upload: Yes/No
   - ✓ Overall success: Yes/No
   - Any specific errors encountered

### Manual Testing in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Check if the `profile-photos` bucket exists
4. Try uploading a test file manually
5. Check the Policies tab to ensure RLS policies are in place

## Troubleshooting Common Issues

### Issue 1: "must be owner of table objects" Error

**Symptoms**: SQL script fails with permission error

**Solution**:
1. **Use the Dashboard UI method** instead of SQL (recommended)
2. The storage.objects table is managed by Supabase system
3. Only bucket creation and policies can be modified by users

### Issue 2: "Extension storage is not available" Error

**Symptoms**: SQL script fails with extension error

**Solution**:
1. Use the Dashboard UI method instead of SQL
2. The storage extension should already be available in Supabase
3. If using SQL, skip the extension creation step

### Issue 3: "Bucket not found" Error

**Symptoms**: Test shows "Bucket exists: No"

**Solution**:
1. Use the Dashboard UI to create the bucket manually
2. Check if the bucket was created in the Storage section of your Supabase dashboard
3. Ensure you're using the correct Supabase project

### Issue 4: "Permission denied" Error

**Symptoms**: Test shows "Bucket accessible: No" or "Can upload: No"

**Solution**:
1. Check that the access policies are correctly created
2. Ensure the user is authenticated
3. Check that the policies use the correct bucket name (`profile-photos`)
4. Verify policies are applied to the correct bucket

### Issue 5: "Network request failed" Error

**Symptoms**: Upload fails with network-related errors

**Solution**:
1. Check your internet connection
2. Verify your Supabase URL and API key are correct
3. Check if your Supabase project is active and not paused
4. Ensure you're not hitting rate limits

### Issue 6: "File size too large" Error

**Symptoms**: Upload fails with size-related errors

**Solution**:
1. The bucket is configured with a 10MB limit
2. Compress your images before upload
3. Use the app's built-in image compression

### Issue 7: "Invalid file type" Error

**Symptoms**: Upload fails with MIME type errors

**Solution**:
1. Only image files are allowed (JPEG, PNG, WebP, GIF)
2. Ensure your image picker is configured correctly
3. Check that the file extension matches the actual file type

## Verification Commands

Run these SQL commands in your Supabase SQL Editor to verify your setup:

### Check Bucket Exists
```sql
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'profile-photos';
```

### Check Policies
```sql
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### Test Bucket Access
```sql
-- This will test if you can list files in the bucket
SELECT * FROM storage.objects 
WHERE bucket_id = 'profile-photos' 
LIMIT 1;
```

## Expected Behavior

When everything is set up correctly:

1. **Test Button Results**:
   - ✓ Bucket exists: Yes
   - ✓ Bucket accessible: Yes
   - ✓ Can upload: Yes
   - ✓ Overall success: Yes
   - No errors listed

2. **Photo Upload**:
   - Users can select photos from gallery or camera
   - Photos are validated for size and format
   - Upload progress is shown
   - Photos appear in the profile gallery
   - Photos are stored in Supabase storage with public URLs

3. **Photo Management**:
   - Users can remove photos
   - Photos are deleted from storage when removed
   - Maximum 6 photos per user enforced

## Environment Variables

Ensure these are set in your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support

If you're still experiencing issues:

1. **Use Dashboard UI**: This is the most reliable method
2. Check the browser console for detailed error messages
3. Use the test button to get specific error information
4. Verify your Supabase project settings
5. Check the Supabase logs in your dashboard

## Next Steps

Once storage is working:

1. Test photo uploads with different image types and sizes
2. Verify photos are accessible via public URLs
3. Test photo deletion functionality
4. Monitor storage usage in your Supabase dashboard
5. Consider implementing image optimization for better performance 