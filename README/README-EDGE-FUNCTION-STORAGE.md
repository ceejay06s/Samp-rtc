# Edge Function Storage Operations Guide

## 🚀 Overview

This guide explains how to use Supabase Edge Functions for secure storage operations (upload, update, delete, list) that bypass RLS restrictions and provide better security.

## ✨ Benefits of Edge Function Storage

### **🔒 Security Advantages**
- **Bypasses RLS restrictions** - Uses service role key for admin access
- **Server-side validation** - File type and size validation on the server
- **Centralized logic** - All storage operations in one place
- **No client-side secrets** - Service role key stays on server

### **⚡ Performance Benefits**
- **Faster uploads** - Direct server-to-storage communication
- **Better error handling** - Detailed error messages
- **Batch operations** - Can handle multiple files efficiently
- **Caching** - Can implement caching strategies

### **🛡️ Reliability**
- **Consistent behavior** - Same logic across all clients
- **Better error recovery** - Automatic retries and fallbacks
- **Monitoring** - Server-side logging and analytics

## 📁 File Structure

```
supabase/
├── functions/
│   └── storage-operations/
│       └── index.ts          # Edge Function for storage operations
src/
├── services/
│   └── edgeStorage.ts        # Client-side service to call Edge Function
└── utils/
    └── bucketTest.ts         # Updated to include Edge Function tests
app/
└── bucket-test.tsx           # Updated UI with Edge Function testing
```

## 🔧 Setup Instructions

### **1. Deploy the Edge Function**

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the Edge Function
npx supabase functions deploy storage-operations

# Or deploy all functions
npx supabase functions deploy
```

### **2. Set Environment Variables**

The Edge Function needs these environment variables:

```bash
# In your Supabase project dashboard > Settings > API
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **3. Enable Edge Functions**

Make sure Edge Functions are enabled in your Supabase project:
1. Go to **Settings > API** in your Supabase dashboard
2. Ensure **Edge Functions** are enabled
3. Note your project URL and service role key

## 🎯 Available Operations

### **📤 Upload File**
```typescript
const result = await EdgeStorageService.uploadFile(
  'user-uploads',           // bucket name
  'profile-photos',         // folder path
  file                      // File object
);

if (result.success) {
  console.log('Upload URL:', result.url);
  console.log('File path:', result.path);
}
```

### **🔄 Update File**
```typescript
const result = await EdgeStorageService.updateFile(
  'user-uploads',           // bucket name
  'profile-photos/avatar.jpg', // full file path
  updatedFile               // new File object
);

if (result.success) {
  console.log('Updated URL:', result.url);
}
```

### **🗑️ Delete File**
```typescript
const result = await EdgeStorageService.deleteFile(
  'user-uploads',           // bucket name
  'profile-photos/avatar.jpg' // file path to delete
);

if (result.success) {
  console.log('File deleted successfully');
}
```

### **📋 List Files**
```typescript
const result = await EdgeStorageService.listFiles(
  'user-uploads',           // bucket name
  'profile-photos'          // optional folder path
);

if (result.success) {
  console.log('Files:', result.files);
}
```

## 🧪 Testing Edge Functions

### **1. Run Individual Tests**

Use the bucket test screen to test Edge Functions:

1. **Navigate to bucket test screen**
2. **Click "Test Edge Function Storage"**
3. **View results** for each operation

### **2. Run All Tests**

```typescript
// Test all storage operations
const result = await BucketTest.testEdgeFunction();

if (result.success) {
  console.log('All Edge Function operations working!');
} else {
  console.error('Edge Function test failed:', result.error);
}
```

### **3. Test Connection**

```typescript
// Test if Edge Function is accessible
const result = await EdgeStorageService.testConnection();

if (result.success) {
  console.log('Edge Function is accessible');
} else {
  console.error('Connection failed:', result.error);
}
```

## 🔍 Edge Function Implementation Details

### **File Upload Process**
1. **Client converts file to base64**
2. **Sends to Edge Function** with metadata
3. **Edge Function validates** file type and size
4. **Converts base64 back to binary**
5. **Uploads to Supabase Storage**
6. **Returns public URL**

### **Error Handling**
- **File size validation** - 50MB limit
- **File type validation** - MIME type checking
- **Network errors** - Automatic retries
- **Storage errors** - Detailed error messages

### **Security Features**
- **Service role authentication** - Admin access
- **Input validation** - Sanitize all inputs
- **CORS handling** - Proper cross-origin support
- **Error sanitization** - Don't expose sensitive info

## 📊 Expected Test Results

### **Successful Test Output**
```json
{
  "success": true,
  "result": {
    "connection": { "success": true, "data": "Edge Function is accessible" },
    "list": { "success": true, "files": [...], "path": "root" },
    "upload": { "success": true, "url": "https://...", "path": "user-uploads/edge-test/test-edge.txt" },
    "update": { "success": true, "url": "https://...", "path": "user-uploads/edge-test/test-edge.txt" },
    "delete": { "success": true, "path": "user-uploads/edge-test/test-edge.txt" }
  }
}
```

### **Error Output**
```json
{
  "success": false,
  "error": "Upload failed: File type text/plain is not allowed in bucket profile-photo"
}
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Edge Function Not Deployed**
```
Error: HTTP 404: Not Found
```
**Solution**: Deploy the Edge Function using `npx supabase functions deploy storage-operations`

#### **2. Authentication Failed**
```
Error: HTTP 401: Unauthorized
```
**Solution**: Check your API key and ensure it's the service role key

#### **3. CORS Error**
```
Error: CORS policy blocked request
```
**Solution**: The Edge Function includes CORS headers, check your client configuration

#### **4. File Size Too Large**
```
Error: File size exceeds maximum allowed size of 50MB
```
**Solution**: Reduce file size or increase the limit in the Edge Function

#### **5. Invalid File Type**
```
Error: File type image/jpeg is not allowed in bucket profile-photo
```
**Solution**: Check the allowed MIME types for your bucket

### **Debug Steps**

1. **Check Edge Function logs**:
   ```bash
   npx supabase functions logs storage-operations
   ```

2. **Test Edge Function directly**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/storage-operations \
     -H "Authorization: Bearer your-anon-key" \
     -H "Content-Type: application/json" \
     -d '{"operation":"list","bucket":"profile-photo"}'
   ```

3. **Verify environment variables**:
   - Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Supabase dashboard
   - Ensure Edge Function has access to these variables

## 🔄 Migration from Direct Storage

### **Before (Direct Storage)**
```typescript
// Direct Supabase storage (may have RLS issues)
const { data, error } = await supabase.storage
  .from('user-uploads')
  .upload('file.jpg', file);
```

### **After (Edge Function)**
```typescript
// Edge Function storage (bypasses RLS)
const result = await EdgeStorageService.uploadFile(
  'user-uploads',
  '',
  file
);
```

## 🎯 Best Practices

### **1. File Organization**
- Use meaningful folder structures
- Separate different file types into different buckets
- Use consistent naming conventions

### **2. Error Handling**
- Always check `result.success` before proceeding
- Handle specific error types appropriately
- Provide user-friendly error messages

### **3. Performance**
- Compress images before upload
- Use appropriate file formats
- Consider implementing progress indicators

### **4. Security**
- Validate file types on both client and server
- Implement file size limits
- Sanitize file names and paths

## 🚀 Next Steps

1. **Deploy the Edge Function** to your Supabase project
2. **Test the functionality** using the bucket test screen
3. **Integrate into your app** for file uploads
4. **Monitor performance** and adjust as needed
5. **Add additional features** like image resizing, compression, etc.

The Edge Function approach provides a robust, secure, and scalable solution for storage operations! 🎉 