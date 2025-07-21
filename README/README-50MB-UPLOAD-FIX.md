# 50MB Upload Limit Fix

## 🚨 Problem
Your manually created "Test" bucket works with 50MB upload limit, but the `profile-photo` bucket created by SQL script doesn't work for uploads.

## 🔍 Root Cause
The SQL script was creating the bucket with a **10MB file size limit**, but your working "Test" bucket has a **50MB limit**.

**🚨 CRITICAL DISCOVERY**: When you manually create buckets in Supabase Dashboard, the **bucket ID equals the bucket name**. But when we create buckets via SQL with `gen_random_uuid()`, the ID becomes a random UUID, which can cause policy mismatches.

## ✅ Solution

### Step 1: Check Your Test Bucket Configuration

First, let's see exactly how your working "Test" bucket is configured:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the script: `sql/check-test-bucket-config.sql`
3. Note the exact settings of your Test bucket

### Step 2: Recreate Profile-Photo Bucket with 50MB Limit

Run the updated SQL script that matches your Test bucket:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the script: `sql/fix-bucket-connection-50mb.sql`

This script will:
- ✅ Delete the old `profile-photo` bucket
- ✅ Create new bucket with **50MB upload limit**
- ✅ Use **bucket name as bucket ID** (matching manual creation)
- ✅ Set up proper storage policies
- ✅ Verify the configuration

### Step 3: Verify the Configuration

After running the script, check that both buckets have the same settings:

```sql
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as file_size_limit_mb,
  allowed_mime_types
FROM storage.buckets 
WHERE name IN ('Test', 'profile-photo')
ORDER BY name;
```

Both buckets should show **50.00 MB** as the file size limit.

### Step 4: Test Upload

1. Go to your app → **Menu** → **Bucket Connection Test**
2. Click **Run Bucket Test**
3. The test should now pass for uploads

## 🔧 Alternative: Manual Bucket Creation

If the SQL script still doesn't work, create the bucket manually in Supabase Dashboard:

1. Go to **Storage** in Supabase Dashboard
2. Click **Create a new bucket**
3. Set:
   - **Name**: `profile-photo`
   - **Public bucket**: ✅ (checked)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg, image/webp, image/gif`

4. Click **Create bucket**

5. Then run this SQL to create the policies:

```sql
-- Create storage policies for manually created bucket
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photo' AND
  auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can view all profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photo');

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photo' AND
  auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photo' AND
  auth.uid()::text = split_part(name, '/', 1)
);
```

## 🧪 Testing

### Test 1: Small File Upload
Try uploading a small image (< 1MB) to verify basic functionality.

### Test 2: Large File Upload
Try uploading a larger image (10-50MB) to test the new limit.

### Test 3: Bucket Test
Use the built-in bucket test in your app to verify all operations work.

## 🔍 Debugging

If uploads still fail, check:

1. **File size**: Ensure your image is under 50MB
2. **File type**: Ensure it's a supported image format
3. **Authentication**: Ensure user is logged in
4. **Network**: Check internet connection
5. **Console logs**: Look for specific error messages

## 📊 Expected Results

After the fix, you should see:

```
✓ Bucket Exists: Yes
✓ Bucket Accessible: Yes  
✓ Can Upload: Yes
✓ Can Download: Yes
✓ Can Delete: Yes
```

## 🆘 Still Having Issues?

If the problem persists:

1. **Compare bucket settings** with your working Test bucket
2. **Check storage policies** are identical
3. **Verify RLS is enabled** but policies are correct
4. **Test with the same file** that works in Test bucket
5. **Check Supabase plan** (Pro plan required for storage)

## 📝 Summary

The issues were:

1. **File size limit mismatch**:
   - **Test bucket**: 50MB limit ✅ (working)
   - **Profile-photo bucket**: 10MB limit ❌ (not working)

2. **Bucket ID mismatch**:
   - **Manual creation**: ID = name ✅ (working)
   - **SQL creation**: ID = random UUID ❌ (causing policy issues)

**Solution**: Recreate profile-photo bucket with:
- 50MB limit to match your Test bucket
- Bucket name as bucket ID to match manual creation pattern

---

**Need help?** Run the bucket test in your app menu for real-time diagnostics! 