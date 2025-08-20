# Voice Message RLS Fix

## Issue Description
Voice message uploads are failing with the error:
```
Failed to send voice message: Audio upload failed: new row violates row-level security policy
```

This error occurs because the Supabase storage bucket `chat-media` doesn't have proper Row Level Security (RLS) policies set up to allow authenticated users to upload audio files.

## Root Cause
The `chat-media` bucket exists but lacks the necessary RLS policies that allow:
1. Authenticated users to upload files
2. Users to view uploaded files
3. Users to manage their own files

## Solution Options

### Option 1: Quick Fix (Recommended for immediate testing)
Run the simple RLS fix in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql/simple-rls-fix.sql`
4. Execute the script

This creates permissive policies that allow any authenticated user to upload to the `chat-media` bucket.

### Option 2: Comprehensive Fix (Recommended for production)
Run the comprehensive RLS fix in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql/fix-voice-message-rls.sql`
4. Execute the script

This creates more secure policies that restrict users to their own folders while allowing voice message uploads.

## What the Fix Does

### Simple Fix (`simple-rls-fix.sql`)
- Allows any authenticated user to upload to `chat-media` bucket
- Allows any authenticated user to view files in `chat-media` bucket
- Provides basic file management permissions

### Comprehensive Fix (`fix-voice-message-rls.sql`)
- Creates organized folder structure permissions
- Restricts users to their own conversation folders
- Provides secure file access patterns
- Maintains data isolation between users

## Verification Steps

After running either fix:

1. **Check Policies**: Verify the policies were created:
```sql
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND bucket_id = 'chat-media'
ORDER BY policyname;
```

2. **Test Upload**: Try recording and sending a voice message in the app

3. **Check Console**: Look for the detailed logging in the browser console:
```
✅ User authenticated: [user-id]
✅ Audio converted to blob, size: [size] bytes
✅ Bucket accessible: [bucket-info]
✅ Audio uploaded successfully: [upload-data]
✅ Audio public URL generated: [url]
✅ Voice message created successfully: [message-id]
```

## Troubleshooting

### If the issue persists:

1. **Check Authentication**: Ensure the user is properly authenticated
2. **Check Bucket**: Verify the `chat-media` bucket exists and is accessible
3. **Check Policies**: Run the verification query to see if policies exist
4. **Check Permissions**: Ensure the user has the `authenticated` role

### Common Issues:

1. **Bucket doesn't exist**: Create the `chat-media` bucket first
2. **User not authenticated**: Check the auth state in the app
3. **Policy conflicts**: Drop all existing policies and recreate them
4. **Database connection**: Ensure the app can connect to Supabase

## Security Considerations

### Simple Fix:
- ✅ Allows voice messages to work immediately
- ⚠️ Less secure - any authenticated user can upload anywhere in the bucket
- ⚠️ No folder isolation between users

### Comprehensive Fix:
- ✅ Secure folder-based access control
- ✅ User isolation in their own folders
- ✅ Maintains security best practices
- ⚠️ More complex policy structure

## Alternative Solutions

If RLS policies continue to cause issues, consider:

1. **Using Edge Functions**: Upload files through a Supabase Edge Function
2. **Direct Bucket Access**: Temporarily disable RLS (not recommended for production)
3. **Different Storage Strategy**: Use a different storage service for audio files

## Testing

After applying the fix:

1. **Record a voice message** in any chat
2. **Check the console** for detailed logging
3. **Verify the message appears** in the chat
4. **Test playback** of the voice message
5. **Check storage** in Supabase dashboard

## Files Modified

- `src/services/realtimeChat.ts` - Enhanced error handling and logging
- `sql/fix-voice-message-rls.sql` - Comprehensive RLS fix
- `sql/simple-rls-fix.sql` - Simple RLS fix
- `README/README-VOICE-MESSAGE-RLS-FIX.md` - This documentation

## Next Steps

1. Apply one of the RLS fixes in your Supabase dashboard
2. Test voice message functionality
3. Monitor for any remaining issues
4. Consider implementing the comprehensive fix for production use
