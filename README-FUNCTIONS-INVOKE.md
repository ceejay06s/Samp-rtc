# Supabase Functions Invoke Guide

## 🚀 New Approach: `supabase.functions.invoke()`

The Edge Storage service has been updated to use the modern `supabase.functions.invoke()` method instead of direct fetch calls. This approach is:

- **Simpler** - No manual authentication handling
- **More reliable** - Automatic JWT token management
- **Better error handling** - Consistent error responses
- **Type-safe** - Better TypeScript support

## ✨ Benefits of `functions.invoke()`

### **🔐 Automatic Authentication**
- **Handles JWT tokens** automatically
- **Refreshes expired tokens** seamlessly
- **Uses user session** when available
- **Falls back gracefully** when needed

### **🛡️ Better Security**
- **No manual token management** required
- **Automatic token validation**
- **Secure token transmission**
- **Built-in error handling**

### **⚡ Improved Performance**
- **Optimized network requests**
- **Automatic retries** on failures
- **Connection pooling**
- **Better caching**

## 🔄 Migration from Direct Fetch

### **Before (Direct Fetch)**
```typescript
// Manual authentication and fetch
const headers = await this.getAuthHeaders();
const response = await fetch(this.EDGE_FUNCTION_URL, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    operation: 'upload',
    bucket,
    path,
    file: base64File,
    fileType: file.type,
    fileName: file.name
  })
});

const result = await response.json();
if (!response.ok) {
  return { success: false, error: result.error };
}
```

### **After (Functions Invoke)**
```typescript
// Simple and clean
const { data, error } = await supabase.functions.invoke('storage-operations', {
  body: {
    operation: 'upload',
    bucket,
    path,
    file: base64File,
    fileType: file.type,
    fileName: file.name
  }
});

if (error) {
  return { success: false, error: error.message };
}
```

## 🎯 Available Operations

### **📤 Upload File**
```typescript
const result = await EdgeStorageService.uploadFile(
  'user-uploads',           // bucket
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
  'user-uploads',           // bucket
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
  'user-uploads',           // bucket
  'profile-photos/avatar.jpg' // file path to delete
);

if (result.success) {
  console.log('File deleted successfully');
}
```

### **📋 List Files**
```typescript
const result = await EdgeStorageService.listFiles(
  'user-uploads',           // bucket
  'profile-photos'          // optional folder path
);

if (result.success) {
  console.log('Files:', result.files);
}
```

### **🔗 Test Connection**
```typescript
const result = await EdgeStorageService.testConnection();

if (result.success) {
  console.log('Edge Function is accessible');
} else {
  console.error('Connection failed:', result.error);
}
```

## 🧪 Testing the New Approach

### **1. Test Connection**
```typescript
// Test if Edge Function is accessible
const connectionResult = await EdgeStorageService.testConnection();
console.log('Connection test:', connectionResult);
```

### **2. Test File Operations**
```typescript
// Create a test file
const testFile = new File(['Hello World!'], 'test.txt', { type: 'text/plain' });

// Upload test
const uploadResult = await EdgeStorageService.uploadFile('user-uploads', 'test', testFile);
console.log('Upload result:', uploadResult);

// List files
const listResult = await EdgeStorageService.listFiles('user-uploads', 'test');
console.log('List result:', listResult);

// Delete test file
if (uploadResult.success) {
  const deleteResult = await EdgeStorageService.deleteFile('user-uploads', uploadResult.path!);
  console.log('Delete result:', deleteResult);
}
```

### **3. Test in Bucket Test Screen**
1. **Go to bucket test screen**
2. **Click "Test Edge Function Storage"**
3. **Check results** - should work without JWT errors

## 📊 Expected Results

### **Successful Operation**
```json
{
  "success": true,
  "url": "https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/user-uploads/test/test.txt",
  "path": "user-uploads/test/test.txt",
  "data": {
    "success": true,
    "path": "user-uploads/test/test.txt",
    "url": "https://...",
    "data": { ... }
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "File type text/plain is not allowed in bucket profile-photo"
}
```

## 🔍 Error Handling

### **Common Errors and Solutions**

#### **"Function not found"**
- **Cause**: Edge Function not deployed
- **Solution**: Deploy the function using `npx supabase functions deploy storage-operations`

#### **"Invalid JWT"**
- **Cause**: User not authenticated
- **Solution**: Ensure user is logged in before calling functions

#### **"Permission denied"**
- **Cause**: User doesn't have access to the bucket
- **Solution**: Check bucket permissions and RLS policies

#### **"File too large"**
- **Cause**: File exceeds 50MB limit
- **Solution**: Reduce file size or increase limit in Edge Function

## 🚀 Best Practices

### **1. Always Check Authentication**
```typescript
// Ensure user is logged in before calling functions
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.log('Please log in first');
  return;
}
```

### **2. Handle Errors Gracefully**
```typescript
const result = await EdgeStorageService.uploadFile(bucket, path, file);
if (!result.success) {
  console.error('Upload failed:', result.error);
  // Show user-friendly error message
  return;
}
```

### **3. Use Appropriate Buckets**
```typescript
// Use the right bucket for the file type
const bucket = file.type.startsWith('image/') ? 'profile-photo' : 'user-uploads';
const result = await EdgeStorageService.uploadFile(bucket, path, file);
```

### **4. Monitor Performance**
```typescript
// Add timing for performance monitoring
const startTime = Date.now();
const result = await EdgeStorageService.uploadFile(bucket, path, file);
const duration = Date.now() - startTime;
console.log(`Upload took ${duration}ms`);
```

## 🔧 Configuration

### **Environment Variables**
Make sure these are set in your `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Edge Function Environment**
The Edge Function needs these environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎯 Next Steps

1. **Test the new approach** with your bucket test screen
2. **Verify all operations** work correctly
3. **Update your app** to use the new Edge Storage service
4. **Monitor performance** and error rates
5. **Add additional features** as needed

The `supabase.functions.invoke()` approach provides a much cleaner and more reliable way to interact with Edge Functions! 🎉 