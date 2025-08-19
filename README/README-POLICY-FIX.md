# Storage Policy Fix Guide

## 🚨 Issue: Policy Creation Failed

**Error**: `relation "public.pg_policies" does not exist`

This error occurs because the custom RPC function for creating storage policies doesn't exist in your database. The bucket creation was successful, but policy creation failed.

## ✅ Solution Options

### **Option 1: Manual SQL Execution (Recommended)**

1. **Go to your Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/xbcrxnebziipzqoorkti/sql
   - Click on **SQL Editor**

2. **Run the direct policy creation script**:
   - Copy and paste the contents of `sql/direct-storage-policies.sql`
   - Click **Run** to execute the script

3. **Verify policies were created**:
   - The script includes a verification query at the end
   - You should see 16 policies listed for the `storage.objects` table

### **Option 2: Use the Updated Bucket Setup Service**

The bucket setup service has been updated to use direct SQL instead of the missing RPC function:

1. **Run the bucket setup test again**:
   - Go to your bucket test screen
   - Click **"Setup Storage Buckets"**
   - The service will now create policies using direct SQL

### **Option 3: Create the RPC Function First**

If you prefer to use the RPC approach:

1. **Run the RPC function creation script**:
   - Copy and paste the contents of `sql/create-storage-policies.sql`
   - This creates the `create_storage_policy` RPC function
   - Then run the bucket setup again

## 🔧 What Each Policy Does

### **Profile Photo Bucket (`profile-photo`)**
- **View**: Anyone can view profile photos
- **Upload**: Only authenticated users can upload
- **Update**: Only authenticated users can update
- **Delete**: Only authenticated users can delete

### **Telegram Stickers Bucket (`telegram-stickers`)**
- **View**: Anyone can view stickers
- **Upload**: Only authenticated users can upload
- **Update**: Only authenticated users can update
- **Delete**: Only authenticated users can delete

### **User Uploads Bucket (`user-uploads`)**
- **View**: Anyone can view uploaded files
- **Upload**: Only authenticated users can upload
- **Update**: Only authenticated users can update
- **Delete**: Only authenticated users can delete

### **Chat Media Bucket (`chat-media`)**
- **View**: Anyone can view chat media
- **Upload**: Only authenticated users can upload
- **Update**: Only authenticated users can update
- **Delete**: Only authenticated users can delete

## 📊 Expected Results After Fix

### **Successful Policy Creation**
```json
{
  "success": true,
  "buckets": [
    { "bucket": "profile-photo", "status": "exists" },
    { "bucket": "telegram-stickers", "status": "exists" },
    { "bucket": "user-uploads", "status": "exists" },
    { "bucket": "chat-media", "status": "exists" }
  ],
  "policies": [
    { "policy": "Profile photos are viewable by everyone", "status": "created" },
    { "policy": "Users can upload profile photos", "status": "created" },
    { "policy": "Users can update profile photos", "status": "created" },
    { "policy": "Users can delete profile photos", "status": "created" },
    // ... 12 more policies with "status": "created"
  ]
}
```

### **Verification Query**
After running the SQL script, you can verify policies exist:

```sql
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
```

This should return 16 policies (4 policies × 4 buckets).

## 🧪 Test After Fix

1. **Run the bucket setup test**:
   - Go to bucket test screen
   - Click **"Setup Storage Buckets"**
   - All policies should show "created" status

2. **Test file operations**:
   - Try uploading a file to any bucket
   - Try listing files
   - Try updating/deleting files

3. **Test Edge Functions**:
   - Click **"Test Edge Function Storage"**
   - All operations should work without RLS errors

## 🔍 Troubleshooting

### **If Policies Still Fail to Create**

1. **Check RLS is enabled**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

2. **Check existing policies**:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

3. **Check user permissions**:
   - Ensure you're using a user with sufficient privileges
   - Try using the service role key for testing

### **If You Get Permission Errors**

1. **Use service role key** for testing:
   - Go to Settings > API in Supabase dashboard
   - Copy the service role key
   - Use it temporarily for testing

2. **Check bucket permissions**:
   - Ensure buckets are public or you have access
   - Verify bucket names match exactly

## 🎯 Next Steps

After fixing the policies:

1. **Test all storage operations** using the bucket test screen
2. **Test Edge Functions** for secure file operations
3. **Integrate storage** into your app features
4. **Monitor performance** and adjust as needed

## 🚀 Alternative: Use Edge Functions

Since you have Edge Functions deployed, you can bypass RLS entirely:

1. **Use Edge Functions** for all storage operations
2. **No need for complex policies** - Edge Functions use service role
3. **Better security** - Server-side validation and processing
4. **Consistent behavior** - Same logic across all clients

The Edge Function approach is actually more secure and reliable than complex RLS policies!

## 📋 Summary

- ✅ **Buckets created successfully** (4 buckets)
- ❌ **Policies failed** (missing RPC function)
- 🔧 **Fix**: Run the SQL script manually
- 🎯 **Result**: Full storage functionality working

Choose the solution that works best for your needs! 🎉 