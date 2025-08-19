# JWT Authentication Fix Guide

## 🚨 Issue: INVALID JWT Error

**Error**: `INVALID JWT`

This error occurs when the Edge Function receives an invalid or expired JWT token for authentication.

## 🔍 Root Cause Analysis

### **Why This Happens**
1. **Using anon key instead of user JWT** - Edge Functions need valid user tokens
2. **Expired JWT token** - User session has expired
3. **Invalid token format** - Token is malformed or corrupted
4. **Missing authentication** - No token provided in request

### **Authentication Flow**
1. **User logs in** → Gets JWT token
2. **Client sends request** → Includes JWT in Authorization header
3. **Edge Function validates** → Checks token validity
4. **Service role access** → Uses service role for storage operations

## ✅ Solution: Updated Authentication

### **1. Client-Side Fix (Already Applied)**

The `EdgeStorageService` has been updated to:

- **Get user session** before making requests
- **Use JWT token** from authenticated user
- **Fallback to anon key** if no session exists
- **Handle authentication errors** gracefully

### **2. Edge Function Fix (Already Applied)**

The Edge Function now:

- **Validates authorization header** is present
- **Extracts JWT token** from Bearer header
- **Uses service role** for storage operations
- **Logs authentication status** for debugging

## 🧪 Testing the Fix

### **1. Ensure User is Logged In**

```typescript
// Check if user is authenticated
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  console.log('User not logged in - please log in first');
  return;
}
console.log('User authenticated:', user.id);
```

### **2. Test Edge Function Connection**

```typescript
// Test connection with proper authentication
const result = await EdgeStorageService.testConnection();
if (result.success) {
  console.log('✅ Edge Function accessible with valid JWT');
} else {
  console.error('❌ Edge Function failed:', result.error);
}
```

### **3. Test File Operations**

```typescript
// Test upload with authentication
const uploadResult = await EdgeStorageService.uploadFile(
  'user-uploads',
  'test',
  file
);

if (uploadResult.success) {
  console.log('✅ File uploaded successfully');
  console.log('URL:', uploadResult.url);
} else {
  console.error('❌ Upload failed:', uploadResult.error);
}
```

## 🔧 Manual Testing Steps

### **Step 1: Verify User Authentication**
1. **Open your app**
2. **Log in** with a valid user account
3. **Check authentication status** in the app

### **Step 2: Test Edge Functions**
1. **Go to bucket test screen**
2. **Click "Test Edge Function Storage"**
3. **Check results** for authentication success

### **Step 3: Test File Operations**
1. **Try uploading a file** using Edge Functions
2. **Try listing files** in a bucket
3. **Try updating/deleting files**

## 🚨 Troubleshooting

### **If Still Getting JWT Errors**

#### **1. Check User Session**
```typescript
// Debug user session
const { data: { session }, error } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Error:', error);
```

#### **2. Check Token Validity**
```typescript
// Verify token is valid
const { data: { user }, error } = await supabase.auth.getUser();
if (error) {
  console.error('Token invalid:', error.message);
  // Re-authenticate user
  await supabase.auth.refreshSession();
}
```

#### **3. Force Re-authentication**
```typescript
// Refresh user session
const { data, error } = await supabase.auth.refreshSession();
if (error) {
  console.error('Session refresh failed:', error);
  // Redirect to login
}
```

### **Common Issues and Solutions**

#### **Issue: "No authorization header provided"**
**Solution**: User is not logged in. Log in first.

#### **Issue: "Invalid JWT token"**
**Solution**: Session expired. Refresh session or re-login.

#### **Issue: "Token verification failed"**
**Solution**: Token is malformed. Re-authenticate user.

#### **Issue: "User not found"**
**Solution**: User account doesn't exist. Create account first.

## 🔄 Alternative: Use Service Role Key

If JWT authentication continues to fail, you can temporarily use the service role key:

### **⚠️ Security Warning**
This approach bypasses user authentication and should only be used for testing.

```typescript
// In EdgeStorageService, temporarily use service role key
private static async getAuthHeaders(): Promise<{ [key: string]: string }> {
  // Use service role key directly (for testing only)
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
  };
}
```

## 📊 Expected Results After Fix

### **Successful Authentication**
```json
{
  "success": true,
  "data": "Edge Function is accessible"
}
```

### **Successful File Upload**
```json
{
  "success": true,
  "url": "https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/user-uploads/test/file.jpg",
  "path": "user-uploads/test/file.jpg"
}
```

### **Authentication Error**
```json
{
  "success": false,
  "error": "No authorization header provided"
}
```

## 🎯 Best Practices

### **1. Always Check Authentication**
- Verify user is logged in before making requests
- Handle authentication errors gracefully
- Provide clear error messages to users

### **2. Use Proper Error Handling**
- Catch and log authentication errors
- Implement retry logic for expired tokens
- Fallback to login flow when needed

### **3. Monitor Authentication**
- Log authentication attempts
- Track failed requests
- Monitor token expiration

## 🚀 Next Steps

1. **Test authentication** with a logged-in user
2. **Verify Edge Functions** work with JWT tokens
3. **Test file operations** (upload, list, update, delete)
4. **Monitor logs** for any remaining issues
5. **Deploy to production** once testing is complete

The JWT authentication should now work properly with valid user sessions! 🎉 