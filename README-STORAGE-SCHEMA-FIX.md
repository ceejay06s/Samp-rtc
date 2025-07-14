# Fix Storage Schema Lock Issues

If you're experiencing storage schema lock issues in Supabase, here are several solutions to try.

## 🔍 **Step 1: Diagnose the Issue**

First, run the diagnostic script to understand what's wrong:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `sql/fix-storage-schema-lock.sql`
3. Click "Run"

This will show you:
- ✅ Storage extension status
- ✅ Schema permissions
- ✅ Table access
- ✅ Any active locks
- ✅ User permissions

## 🎯 **Solution 1: Use Dashboard UI (Recommended)**

The Dashboard UI approach bypasses schema lock issues:

### Create Bucket via Dashboard
1. Go to **Storage** in your Supabase Dashboard
2. Click **Create a new bucket**
3. Configure:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ Checked
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

### Add Policies via Dashboard
1. Click on your `profile-photos` bucket
2. Go to **Policies** tab
3. Click **New Policy** and add these 4 policies:

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

## 🔧 **Solution 2: Reset Storage Extension**

If the Dashboard UI doesn't work, try resetting the storage extension:

### Step 1: Drop and Recreate Extension
```sql
-- Drop the storage extension
DROP EXTENSION IF EXISTS storage CASCADE;

-- Recreate the storage extension
CREATE EXTENSION storage SCHEMA storage;
```

### Step 2: Grant Permissions
```sql
-- Grant necessary permissions
GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO postgres;

-- Grant to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
```

### Step 3: Create Bucket and Policies
Run the comprehensive storage fix script:
```sql
-- Run the contents of sql/comprehensive-storage-fix.sql
```

## 🚨 **Solution 3: Contact Supabase Support**

If the above solutions don't work:

1. **Check your plan**: Storage might be disabled on free plans
2. **Contact support**: Reach out to Supabase support with:
   - Your project URL
   - Error messages from the diagnostic script
   - Steps you've already tried

## 🔍 **Common Schema Lock Issues**

### Issue 1: Extension Not Installed
**Symptoms**: "extension storage is not available"
**Solution**: Use Dashboard UI or contact support

### Issue 2: Permission Denied
**Symptoms**: "permission denied for schema storage"
**Solution**: Use Dashboard UI approach

### Issue 3: Schema Locked
**Symptoms**: "schema storage is locked"
**Solution**: Wait a few minutes and try again, or use Dashboard UI

### Issue 4: User Not Authorized
**Symptoms**: "not authorized to access storage"
**Solution**: Check your Supabase plan and permissions

## ✅ **Verification Steps**

After fixing the schema lock:

1. **Test in Dashboard**: Try uploading a file manually
2. **Test in App**: Use the "Test Storage Connection" button
3. **Check Logs**: Look for any remaining errors

## 🎯 **Alternative: Use Different Storage**

If Supabase storage continues to have issues, consider:

1. **Cloudinary**: Image upload service
2. **AWS S3**: Direct S3 integration
3. **Firebase Storage**: Google's storage solution

## 📋 **Quick Checklist**

- [ ] Run diagnostic script
- [ ] Try Dashboard UI approach
- [ ] Check Supabase plan limits
- [ ] Verify project settings
- [ ] Test storage connection
- [ ] Contact support if needed

The Dashboard UI approach is the most reliable way to avoid schema lock issues! 