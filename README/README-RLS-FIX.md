# RLS Policy Fix Guide

## 🚨 Issue: Row Level Security Policy Violation

**Error**: `new row violates row-level security policy`

This error occurs because the current user doesn't have permission to create storage buckets or policies due to Row Level Security (RLS) restrictions.

## ✅ Solution: Manual Setup Required

Due to RLS restrictions, storage buckets and policies must be created manually in the Supabase dashboard. Here's how to fix it:

## 🔧 Step-by-Step Fix

### **1. Create Storage Buckets Manually**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/xbcrxnebziipzqoorkti)
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Create these buckets:

#### **Profile Photos Bucket**
- **Name**: `profile-photo`
- **Public**: ✅ Yes
- **File size limit**: `52428800` (50MB)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

#### **Telegram Stickers Bucket**
- **Name**: `telegram-stickers`
- **Public**: ✅ Yes
- **File size limit**: `52428800` (50MB)
- **Allowed MIME types**: `image/webp, image/png, image/gif`

#### **User Uploads Bucket**
- **Name**: `user-uploads`
- **Public**: ✅ Yes
- **File size limit**: `52428800` (50MB)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, text/plain, application/pdf, text/csv`

#### **Chat Media Bucket**
- **Name**: `chat-media`
- **Public**: ✅ Yes
- **File size limit**: `52428800` (50MB)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, audio/mpeg, audio/wav, text/plain`

### **2. Create Storage Policies**

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL script:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Profile photo policies
CREATE POLICY "Profile photos are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photo');

CREATE POLICY "Users can upload profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update profile photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete profile photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

-- Telegram stickers policies
CREATE POLICY "Telegram stickers are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'telegram-stickers');

CREATE POLICY "Users can upload stickers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update stickers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete stickers" ON storage.objects
  FOR DELETE USING (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

-- User uploads policies
CREATE POLICY "User uploads are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

-- Chat media policies
CREATE POLICY "Chat media is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update chat media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete chat media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
```

## 🧪 Test the Fix

After creating the buckets and policies manually:

1. **Run the bucket test** in your app
2. **Click "Setup Storage Buckets"** - it should now show existing buckets
3. **Run "Test File Size Validation"** - should work with proper image files
4. **Run "Test Folder Creation"** - should work with existing buckets

## 🔍 Why This Happens

### **RLS Restrictions**
- Supabase enforces Row Level Security by default
- Regular users cannot create storage buckets or policies
- Only service role or admin users can create these resources

### **Security Best Practice**
- This is actually a security feature, not a bug
- Prevents unauthorized users from creating storage resources
- Ensures proper access control

## 🎯 Alternative Solutions

### **Option 1: Use Service Role Key (Not Recommended)**
- Use the service role key for bucket creation
- **Security Risk**: Service role has full access
- **Not Recommended**: For production applications

### **Option 2: Manual Setup (Recommended)**
- Create buckets and policies manually
- **Security**: Proper access control
- **Recommended**: For production applications

### **Option 3: Edge Function (Advanced)**
- Create a Supabase Edge Function with service role
- **Complexity**: Requires additional setup
- **Use Case**: For automated deployments

## 📊 Expected Results

After manual setup, your bucket test should show:

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
    { "policy": "Storage Policies Setup Required", "status": "error", "error": "Policies must be created manually in Supabase dashboard. See README for instructions." }
  ]
}
```

## 🚀 Next Steps

1. **Create the buckets manually** in Supabase dashboard
2. **Run the SQL script** to create policies
3. **Test the storage functionality** in your app
4. **Start using storage** for file uploads

The RLS error will be resolved once you complete the manual setup! 🎉 