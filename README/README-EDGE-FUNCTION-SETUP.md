# Supabase Edge Function Image Upload Setup

This guide explains how to set up and use the Edge Function for image uploads in the chat with conversation-based folder organization.

## Overview

The Edge Function provides a secure way to upload images to Supabase Storage with:
- User authentication validation
- File type validation
- **Conversation-based folder organization**
- Automatic file naming and organization
- Public URL generation
- Error handling and logging

## Folder Structure

Images are organized by conversation for better management:

```
chat-images/
├── conversations/
│   ├── conv-123/
│   │   ├── user-456/
│   │   │   ├── 1703123456789.jpg
│   │   │   └── 1703123456790.png
│   │   └── user-789/
│   │       └── 1703123456791.jpg
│   └── conv-124/
│       └── user-456/
│           └── 1703123456792.jpg
└── user-456/  # Fallback for images without conversation ID
    └── 1703123456793.jpg
```

## Setup Instructions

### 1. Deploy the Edge Function

1. **Navigate to your Supabase project directory:**
   ```bash
   cd supabase
   ```

2. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy upload-image
   ```

3. **Verify deployment:**
   ```bash
   supabase functions list
   ```

### 2. Create Storage Bucket

Create a storage bucket for chat images:

1. Go to your **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. Configure:
   - **Name**: `chat-images`
   - **Public bucket**: ✅ Checked
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*`
4. Click **Create bucket**

### 3. Configure Storage Policies

Add these policies to the `chat-images` bucket:

#### Upload Policy
```sql
CREATE POLICY "Users can upload chat images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.role() = 'authenticated' AND
  (
    -- Allow uploads to conversation folders
    (name LIKE 'conversations/%' AND auth.uid()::text = split_part(name, '/', 3)) OR
    -- Allow uploads to user folders (fallback)
    (name NOT LIKE 'conversations/%' AND auth.uid()::text = split_part(name, '/', 1))
  )
);
```

#### View Policy
```sql
CREATE POLICY "Users can view chat images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-images'
);
```

#### Delete Policy
```sql
CREATE POLICY "Users can delete their chat images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' AND
  (
    -- Allow deletion from conversation folders
    (name LIKE 'conversations/%' AND auth.uid()::text = split_part(name, '/', 3)) OR
    -- Allow deletion from user folders (fallback)
    (name NOT LIKE 'conversations/%' AND auth.uid()::text = split_part(name, '/', 1))
  )
);
```

### 4. Test the Setup

1. **Test the Edge Function:**
   ```typescript
   import { ImageUploadService } from '../services/imageUploadService';
   
   // Test the connection
   const testResult = await ImageUploadService.testConnection();
   console.log('Test result:', testResult);
   ```

2. **Test image upload in chat:**
   - Open the chat screen
   - Tap the image button
   - Select an image
   - Verify it uploads successfully to the conversation folder

## How It Works

### 1. Image Selection
- User selects image from gallery
- Image is converted to base64 format
- File metadata is extracted

### 2. Edge Function Processing
- User authentication is validated
- File type is verified (images only)
- Base64 data is converted to binary
- **Conversation ID is used for folder organization**
- Unique filename is generated: `conversations/{conversationId}/{userId}/{timestamp}.{extension}`

### 3. Storage Upload
- Image is uploaded to `chat-images` bucket in conversation folder
- Public URL is generated
- Response includes the public URL and file path

### 4. Chat Integration
- Uploaded image URL is added to message
- Image appears in chat with proper styling
- Message is sent with image attachment

## Implementation Details

### Client-Side Service
The `ImageUploadService` uses `supabase.functions.invoke()` with conversation ID:

```typescript
const { data, error } = await supabase.functions.invoke('upload-image', {
  body: {
    imageData: base64Data,
    fileName: fileName,
    contentType: contentType,
    conversationId: conversationId, // For folder organization
  },
});
```

### Edge Function
The Edge Function handles:
- Authentication validation
- File type validation
- Base64 to binary conversion
- **Conversation-based folder creation**
- Storage upload
- Public URL generation

### Folder Organization Logic
```typescript
// Create folder structure: conversations/{conversationId}/{userId}/{timestamp}.{extension}
const uniqueFileName = conversationId 
  ? `conversations/${conversationId}/${user.id}/${timestamp}.${fileExtension}`
  : `${user.id}/${timestamp}.${fileExtension}` // Fallback
```

## File Structure

```
supabase/
├── functions/
│   └── upload-image/
│       └── index.ts          # Edge Function code
src/
├── services/
│   └── imageUploadService.ts # Client-side service
└── components/
    └── ui/
        └── EnhancedRealtimeChat.tsx # Chat component
```

## Security Features

### Authentication
- JWT token validation
- User must be authenticated
- User can only upload to their own folder within conversations

### File Validation
- Only image files allowed
- File type verification
- Size limits enforced

### Storage Security
- Row Level Security (RLS) policies
- User-specific file organization within conversations
- Public read access for chat images
- **Conversation-based access control**

## Benefits of Conversation-Based Organization

### ✅ **Better Organization**
- Images grouped by conversation
- Easy to find and manage
- Clear folder structure

### ✅ **Improved Performance**
- Faster file lookups
- Better caching
- Reduced storage queries

### ✅ **Enhanced Security**
- Conversation-specific access control
- User isolation within conversations
- Easier cleanup and management

### ✅ **Scalability**
- Better for large numbers of conversations
- Easier backup and restore
- Improved storage efficiency

## Error Handling

### Common Errors

1. **Unauthorized (401)**
   - User not logged in
   - Invalid JWT token

2. **Bad Request (400)**
   - Missing required fields
   - Invalid file type
   - File too large

3. **Internal Server Error (500)**
   - Storage bucket issues
   - Network problems
   - Server configuration issues

### Debugging

1. **Check Edge Function logs:**
   ```bash
   supabase functions logs upload-image
   ```

2. **Test connection:**
   ```typescript
   const result = await ImageUploadService.testConnection();
   console.log(result);
   ```

3. **Check storage bucket:**
   - Verify bucket exists
   - Check policies are applied
   - Test manual upload

## Performance Considerations

### Optimization
- Images are compressed before upload
- Base64 conversion happens client-side
- Unique filenames prevent conflicts
- Cache headers for better performance
- **Conversation-based organization improves lookup speed**

### Limits
- Maximum file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Rate limiting: Supabase default limits

## Troubleshooting

### Edge Function Not Deployed
```bash
# Check if function exists
supabase functions list

# Redeploy if needed
supabase functions deploy upload-image
```

### Storage Bucket Issues
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'chat-images';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Authentication Issues
- Verify user is logged in
- Check JWT token is valid
- Ensure session is active

## Future Enhancements

### Planned Features
- Image compression and optimization
- Multiple image upload support
- Progress indicators
- Retry mechanisms
- Image preview before upload
- **Conversation cleanup tools**

### Advanced Features
- Image cropping and editing
- Automatic thumbnail generation
- CDN integration
- Image metadata extraction
- **Conversation-based image galleries** 