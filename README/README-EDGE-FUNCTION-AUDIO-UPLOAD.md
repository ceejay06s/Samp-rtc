# Edge Function Audio Upload

## Overview
This solution uses a Supabase Edge Function to handle audio uploads, bypassing RLS policy issues and providing a more secure and reliable upload mechanism.

## How It Works

### 1. **Client Side**
- User records audio using Expo Audio API
- Audio blob is converted to base64
- Payload is sent to Edge Function via `supabase.functions.invoke()`

### 2. **Edge Function**
- Runs on Supabase servers with service role permissions
- Bypasses RLS policies entirely
- Converts base64 back to binary data
- Uploads to `chat-media` bucket
- Creates message in database
- Returns success response with message ID and audio URL

### 3. **Benefits**
- ✅ **No RLS Issues**: Bypasses complex storage policies
- ✅ **Secure**: Runs with service role permissions
- ✅ **Reliable**: Server-side processing
- ✅ **Organized**: Maintains folder structure
- ✅ **Fallback**: Includes direct upload as backup

## Files Created

### Edge Function
- `supabase/functions/upload-audio/index.ts` - Main Edge Function

### Client Service
- `src/services/audioUploadService.ts` - Client-side service for calling Edge Function

### Updated Services
- `src/services/realtimeChat.ts` - Updated to use Edge Function approach

## Deployment Steps

### 1. **Deploy Edge Function**
```bash
# Navigate to project root
cd /path/to/your/project

# Deploy the upload-audio function
npx supabase functions deploy upload-audio

# Or deploy all functions
npx supabase functions deploy
```

### 2. **Set Environment Variables**
Ensure these are set in your Supabase project:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Verify Deployment**
Check the Edge Functions section in your Supabase dashboard to ensure `upload-audio` is deployed and active.

## Usage

### Basic Usage
```typescript
import { AudioUploadService } from '../services/audioUploadService';

const audioUploadService = AudioUploadService.getInstance();

const result = await audioUploadService.uploadAudioViaEdgeFunction({
  audioBlob: audioBlob,
  conversationId: 'conversation-id',
  duration: 15, // seconds
  metadata: { /* optional metadata */ }
});

if (result.success) {
  console.log('Audio uploaded:', result.audioUrl);
  console.log('Message ID:', result.messageId);
} else {
  console.error('Upload failed:', result.error);
}
```

### Integration with Chat
The `RealtimeChatService.sendVoiceMessage()` method now automatically uses the Edge Function approach.

## Edge Function Details

### Request Payload
```typescript
{
  audioData: string,        // Base64 encoded audio data
  fileName: string,         // Generated filename (e.g., "voice_1234567890_abc123.webm")
  conversationId: string,   // ID of the conversation
  userId: string,          // ID of the user uploading
  duration: number,        // Duration in seconds
  metadata?: any           // Optional additional metadata
}
```

### Response
```typescript
{
  success: boolean,
  message: string,
  data: {
    messageId: string,      // ID of created message
    audioUrl: string,       // Public URL for streaming
    audioPath: string,      // Storage path
    fileSize: number,       // File size in MB
    duration: number        // Duration in seconds
  }
}
```

### File Organization
```
chat-media/
└── voice/
    └── conversations/
        └── {conversationId}/
            └── {userId}/
                └── voice_{timestamp}_{random}.webm
```

## Error Handling

### Common Errors
1. **Authentication Failed**: User not logged in
2. **File Too Large**: Exceeds 50MB limit
3. **Missing Fields**: Required payload fields missing
4. **Upload Failed**: Storage or database errors

### Fallback Mechanism
If the Edge Function fails, the service falls back to direct upload (though this may still have RLS issues).

## Testing

### 1. **Test Edge Function**
```bash
# Test locally (if Supabase is running)
npx supabase functions serve upload-audio

# Test deployed function
curl -X POST https://your-project.supabase.co/functions/v1/upload-audio \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"audioData":"base64data","fileName":"test.webm","conversationId":"test","userId":"test","duration":5}'
```

### 2. **Test in App**
1. Record a voice message in any chat
2. Check console for detailed logging
3. Verify message appears in chat
4. Test audio playback

## Security Considerations

### ✅ **Secure Aspects**
- Service role permissions for uploads
- File size limits (50MB)
- Organized folder structure
- User authentication required
- No direct client access to storage

### ⚠️ **Considerations**
- Edge Functions run with elevated permissions
- Base64 encoding increases payload size (~33% overhead)
- All authenticated users can upload to any conversation

## Troubleshooting

### Edge Function Not Deployed
```bash
# Check deployment status
npx supabase functions list

# Redeploy if needed
npx supabase functions deploy upload-audio
```

### Function Invocation Errors
1. Check function logs in Supabase dashboard
2. Verify environment variables are set
3. Check function permissions and quotas

### Upload Still Failing
1. Check Edge Function logs
2. Verify bucket exists and is accessible
3. Check service role key permissions
4. Test with simple payload first

## Performance

### File Size Limits
- **Maximum**: 50MB per audio file
- **Recommended**: Under 10MB for better performance
- **Format**: WebM (Web Audio API compatible)

### Upload Time
- **Small files (<1MB)**: ~1-3 seconds
- **Medium files (1-10MB)**: ~3-10 seconds
- **Large files (10-50MB)**: ~10-30 seconds

## Monitoring

### Edge Function Logs
Check logs in Supabase dashboard:
1. Go to Edge Functions
2. Select `upload-audio`
3. View logs for errors and performance

### Client Logs
The service provides detailed console logging:
```
🎤 Starting audio upload via Edge Function
✅ User authenticated: [user-id]
✅ Audio converted to blob, size: [size] bytes
📤 Preparing upload data: {...}
✅ Audio upload successful: {...}
```

## Next Steps

1. **Deploy the Edge Function** to your Supabase project
2. **Test voice message functionality** in the app
3. **Monitor performance** and error rates
4. **Consider optimizations** like compression or chunked uploads
5. **Implement additional features** like audio processing or transcription

## Alternative Approaches

If Edge Functions don't work for your use case:

1. **Direct Upload with RLS Fix**: Use the SQL scripts in `sql/` folder
2. **Third-party Storage**: Use services like AWS S3 or Cloudinary
3. **Custom Backend**: Build a dedicated audio upload API
4. **WebRTC**: Stream audio directly between users (more complex)
