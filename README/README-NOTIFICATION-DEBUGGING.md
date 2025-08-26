# Notification Debugging Guide

## Current Issue
Notifications are being saved to the database (`notification_history` table) but push notifications are not being triggered.

## Debugging Steps

### 1. Check Console Logs
When you send a message, you should see these logs in the console:

```
📤 Attempting to send push notification to user: [user-id]
📡 Push notification response status: [status-code]
✅ Push notification sent successfully: [result]
```

If you see different logs or errors, note them down.

### 2. Check Edge Function Status
Verify that the `send-push-notification` edge function is deployed and working:

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Check if `send-push-notification` is listed and active
4. Look for any error logs in the function

### 3. Test Edge Function Directly
You can test the edge function directly using curl or Postman:

```bash
curl -X POST "https://xbcrxnebziipzqoorkti.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiY3J4bmViemlpcHpxb29ya3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTQyNTYsImV4cCI6MjA2Nzg5MDI1Nn0.oAETtcpGaNvvF-MWxN5zwIqJEwaW4u8XRbDu3BIfQ5g" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["test-user-id"],
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {"type": "test"},
    "notificationType": "test"
  }'
```

### 4. Check Push Tokens
Verify that the recipient has valid push tokens:

1. Check the `push_tokens` table in Supabase
2. Ensure the user has a record with `is_active: true`
3. Verify the token is not expired

### 5. Check Notification Preferences
Verify that the recipient has notifications enabled:

1. Check the `notification_preferences` table
2. Ensure `message_notifications: true`
3. Ensure `push_enabled: true`

## Common Issues and Solutions

### Issue: Edge Function Not Found (404)
**Solution**: Deploy the edge function from `supabase/functions/send-push-notification/`

### Issue: Authorization Failed (401)
**Solution**: Check that the anon key is correct and the function is accessible

### Issue: No Push Tokens Found
**Solution**: Ensure the user has granted notification permissions and tokens are stored

### Issue: Function Error (500)
**Solution**: Check the edge function logs for internal errors

## Testing the Fix

After applying any fixes:

1. **Send a test message**
2. **Check console logs** for the notification flow
3. **Verify database records** in `notification_history`
4. **Check edge function logs** for any errors
5. **Test push notification delivery** on the recipient device

## Expected Flow

1. Message sent → `sendMessage()` called
2. Notification created → `sendMessageNotification()` called
3. Database record created → `notification_history` table
4. Edge function called → `send-push-notification`
5. Push notification sent → Recipient receives notification

## Debug Commands

### Check Edge Function Status
```bash
supabase functions list
```

### Deploy Edge Function
```bash
supabase functions deploy send-push-notification
```

### Check Function Logs
```bash
supabase functions logs send-push-notification
```

## Next Steps

1. **Check console logs** when sending a message
2. **Verify edge function** is deployed and accessible
3. **Test with curl** to isolate the issue
4. **Check push tokens** and notification preferences
5. **Review edge function logs** for errors

Let me know what you see in the console logs when you send a message!
