# Storage Bucket API Setup Guide

## 🚀 API-Based Bucket Creation

I've created a comprehensive API service to automatically create storage buckets and policies if they don't exist. This eliminates the need for manual SQL setup.

## ✅ What's Available

### **1. BucketSetupService**
- **Location**: `src/services/bucketSetup.ts`
- **Purpose**: Programmatically create buckets and policies
- **Features**: 
  - Creates buckets if they don't exist
  - Sets up proper RLS policies
  - Validates existing buckets
  - Provides detailed results

### **2. Bucket Test Integration**
- **Location**: `src/utils/bucketTest.ts`
- **New Method**: `testBucketSetup()`
- **UI Integration**: Added to bucket test screen

## 🛠️ How to Use

### **Option 1: Use the Bucket Test Screen**

1. **Start your app**:
   ```bash
   npm start
   ```

2. **Navigate to bucket test screen**

3. **Click "Setup Storage Buckets"** button

4. **View results**:
   - ✅ Buckets created successfully
   - ✅ Policies configured
   - 📊 Detailed status for each bucket/policy

### **Option 2: Use in Your Code**

```typescript
import { BucketSetupService } from '../src/services/bucketSetup';

// Setup all storage buckets and policies
const setupStorage = async () => {
  const result = await BucketSetupService.setupStorage();
  
  if (result.success) {
    console.log('✅ Storage setup completed');
    console.log('Buckets:', result.buckets);
    console.log('Policies:', result.policies);
  } else {
    console.error('❌ Storage setup failed:', result.error);
  }
};

// Check which buckets exist
const checkBuckets = async () => {
  const { exists, missing } = await BucketSetupService.checkBuckets();
  
  console.log('Existing buckets:', exists);
  console.log('Missing buckets:', missing);
};

// Get bucket configuration
const getConfig = () => {
  const configs = BucketSetupService.getAllBucketConfigs();
  console.log('Bucket configurations:', configs);
};
```

### **Option 3: Run Comprehensive Test**

Click **"Run All Storage Tests"** to:
- ✅ Test bucket connection
- ✅ Test folder creation
- ✅ Test file size validation
- ✅ **Setup storage buckets** (NEW!)
- 📊 Get comprehensive results

## 📋 Bucket Configurations

### **Profile Photos**
```typescript
{
  id: 'profile-photo',
  name: 'profile-photo',
  public: true,
  file_size_limit: 52428800, // 50MB
  allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}
```

### **Telegram Stickers**
```typescript
{
  id: 'telegram-stickers',
  name: 'telegram-stickers',
  public: true,
  file_size_limit: 52428800, // 50MB
  allowed_mime_types: ['image/webp', 'image/png', 'image/gif']
}
```

### **User Uploads**
```typescript
{
  id: 'user-uploads',
  name: 'user-uploads',
  public: true,
  file_size_limit: 52428800, // 50MB
  allowed_mime_types: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'text/plain', 'application/pdf', 'text/csv'
  ]
}
```

### **Chat Media**
```typescript
{
  id: 'chat-media',
  name: 'chat-media',
  public: true,
  file_size_limit: 52428800, // 50MB
  allowed_mime_types: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'text/plain'
  ]
}
```

## 🔐 Security Policies

The API automatically creates these policies for each bucket:

### **Public Read Access**
- All buckets are publicly readable
- No authentication required for viewing files

### **Authenticated Write Access**
- Only authenticated users can upload/update/delete
- Proper user isolation and security

### **Bucket-Specific Policies**
- Each bucket has tailored policies
- Supports user-specific file management
- Chat media with conversation-based access

## 📊 API Response Format

```typescript
interface BucketSetupResult {
  success: boolean;
  buckets: BucketResult[];
  policies: PolicyResult[];
  error?: string;
}

interface BucketResult {
  bucket: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
}

interface PolicyResult {
  policy: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
}
```

## 🎯 Example Response

```json
{
  "success": true,
  "buckets": [
    { "bucket": "profile-photo", "status": "exists" },
    { "bucket": "telegram-stickers", "status": "exists" },
    { "bucket": "user-uploads", "status": "created" },
    { "bucket": "chat-media", "status": "created" }
  ],
  "policies": [
    { "policy": "Profile photos are viewable by everyone", "status": "exists" },
    { "policy": "Users can upload profile photos", "status": "created" },
    { "policy": "Users can update profile photos", "status": "created" },
    { "policy": "Users can delete profile photos", "status": "created" }
  ]
}
```

## 🔧 Error Handling

The API provides detailed error information:

```typescript
// Example error response
{
  "success": false,
  "error": "Failed to create bucket: Insufficient permissions",
  "buckets": [
    { "bucket": "profile-photo", "status": "error", "error": "Bucket already exists" }
  ],
  "policies": []
}
```

## 🚀 Benefits

### **1. No Manual Setup Required**
- ✅ Automatic bucket creation
- ✅ Automatic policy setup
- ✅ No SQL knowledge needed

### **2. Idempotent Operations**
- ✅ Safe to run multiple times
- ✅ Won't recreate existing buckets
- ✅ Won't duplicate policies

### **3. Comprehensive Testing**
- ✅ Integrated with bucket tests
- ✅ Detailed success/failure reporting
- ✅ Real-time status updates

### **4. Production Ready**
- ✅ Error handling
- ✅ Logging
- ✅ Type safety
- ✅ Cross-platform compatibility

## 🎉 Quick Start

1. **Run the bucket test screen**
2. **Click "Setup Storage Buckets"**
3. **View the results**
4. **Start using storage in your app!**

Your storage buckets are now ready to use with proper security policies! 🚀 