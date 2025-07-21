# Bucket Connection Fix Guide

This guide will help you fix bucket connection issues in your Supabase storage setup.

## 🚨 Common Issues

### 1. **Bucket Doesn't Exist**
- **Error**: "Storage bucket 'profile-photo' does not exist"
- **Solution**: Run the SQL setup script

### 2. **Storage Not Available (Free Plan)**
- **Error**: "Storage not available on free plan"
- **Solution**: Upgrade to Supabase Pro plan

### 3. **Permission Denied**
- **Error**: "Permission denied" or "Access denied"
- **Solution**: Check storage policies and RLS settings

### 4. **Authentication Issues**
- **Error**: "User not authenticated"
- **Solution**: Ensure user is logged in

## 🔧 Step-by-Step Fix

### Step 1: Run the SQL Setup Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql/fix-bucket-connection.sql`
4. Click **Run** to execute the script

```sql
-- This script will:
-- 1. Drop existing policies
-- 2. Create the bucket with correct settings
-- 3. Create storage policies
-- 4. Verify the setup
```

### Step 2: Verify Bucket Creation

After running the script, check if the bucket was created:

```sql
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE name = 'profile-photo';
```

### Step 3: Check Storage Policies

Verify that the policies were created correctly:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%profile%'
ORDER BY policyname;
```

### Step 4: Test Bucket Access

Use the built-in test in your app:

1. Navigate to **Menu** → **Bucket Connection Test**
2. Click **Run Bucket Test**
3. Review the results and follow recommendations

## 🧪 Manual Testing

### Test 1: Check Authentication
```javascript
const { data: { user }, error } = await supabase.auth.getUser();
console.log('User:', user?.id);
```

### Test 2: List Buckets
```javascript
const { data: buckets, error } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets?.map(b => b.name));
```

### Test 3: Test Upload
```javascript
const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const response = await fetch(testImageData);
const blob = await response.blob();

const { data, error } = await supabase.storage
  .from('profile-photo')
  .upload(`${userId}/test.png`, blob, {
    contentType: 'image/png',
    cacheControl: '3600',
    upsert: false,
  });
```

## 🔍 Troubleshooting

### Issue: "Storage not available on free plan"

**Cause**: Supabase free plan has limited storage features

**Solutions**:
1. **Upgrade to Pro plan** ($25/month)
2. **Use base64 fallback** (already implemented in the app)

### Issue: "Permission denied"

**Cause**: Row Level Security (RLS) policies are blocking access

**Solutions**:
1. Check if user is authenticated
2. Verify storage policies are correct
3. Ensure bucket is public

### Issue: "Bucket not found"

**Cause**: Bucket wasn't created or has wrong name

**Solutions**:
1. Run the SQL setup script
2. Check bucket name spelling (`profile-photo`, not `profile-photos`)
3. Verify in Supabase dashboard

### Issue: "API key error"

**Cause**: Incorrect or missing API keys

**Solutions**:
1. Check `.env` file for correct keys
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Regenerate keys in Supabase dashboard

## 📋 Checklist

- [ ] User is logged in
- [ ] SQL setup script executed successfully
- [ ] Bucket `profile-photo` exists
- [ ] Storage policies are created
- [ ] Bucket is public
- [ ] API keys are correct
- [ ] App is using correct bucket name
- [ ] Storage is available (Pro plan or base64 fallback)

## 🛠️ Advanced Debugging

### Check Environment Variables
```bash
# Verify your .env file has:
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

### Check Supabase Project Settings
1. Go to **Settings** → **API**
2. Verify **Project URL** and **anon public** key
3. Check **Project API keys** are active

### Check Storage Settings
1. Go to **Storage** in Supabase dashboard
2. Verify bucket exists and is public
3. Check file size limits and allowed types

### Check RLS Policies
1. Go to **Authentication** → **Policies**
2. Verify storage policies are enabled
3. Check policy conditions match your requirements

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the console logs** for detailed error messages
2. **Run the bucket test** in the app menu
3. **Verify your Supabase plan** (free vs pro)
4. **Contact support** with specific error messages

## 📱 App Integration

The app automatically handles bucket connection issues:

- **Free plan**: Falls back to base64 storage
- **Pro plan**: Uses Supabase storage
- **Connection errors**: Shows helpful error messages
- **Test utility**: Built-in bucket connection test

## 🔄 Migration from Old Bucket

If you were using the old `profile-photos` bucket:

1. **Run the migration script** to update bucket name
2. **Update your app** to use `profile-photo`
3. **Test the connection** with the new bucket
4. **Migrate existing files** if needed

---

**Need more help?** Check the bucket test screen in your app menu for real-time diagnostics! 