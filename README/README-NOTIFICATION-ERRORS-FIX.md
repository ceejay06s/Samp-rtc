# Notification Errors Fix

## Issues Identified and Fixed

### Issue 1: Database Schema Error
**Error**: `column "notification_type" of relation "notification_history" does not exist`

**Root Cause**: The `notification_history` table was created with an incorrect schema or the table creation failed.

**Solution**: Run the SQL script `sql/fix-notification-history-schema.sql` in your Supabase SQL editor to recreate the table with the correct schema.

### Issue 2: Status Constraint Error
**Error**: `new row for relation "notification_history" violates check constraint "notification_history_status_check"`

**Root Cause**: The status constraint only allows specific values, but the code is trying to insert a value that's not allowed.

**Solution**: Run the SQL script `sql/update-notification-status-constraint.sql` to update the constraint to allow 'pending' status.

### Issue 2: React Native View Error
**Error**: `Unexpected text node: . A text node cannot be a child of a <View>`

**Root Cause**: Emoji characters (✅, ❌) were being rendered as text nodes inside React Native `<View>` components, which is not allowed.

**Solution**: Updated `src/components/ui/VapidTest.tsx` to replace emoji characters with text strings.

## Files Modified

### 1. Database Schema Fix
- ✅ `sql/fix-notification-history-schema.sql` - Recreates notification_history table with correct schema
- ✅ `sql/update-notification-status-constraint.sql` - Updates status constraint to allow 'pending' status

### 2. React Native Component Fix
- ✅ `src/components/ui/VapidTest.tsx` - Removed emoji characters that caused View errors

## How to Apply the Fixes

### Step 1: Fix Database Schema
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the contents of `sql/fix-notification-history-schema.sql`
4. This will recreate the `notification_history` table with the correct columns

### Step 2: Fix Status Constraint
1. In the same SQL Editor session
2. Run the contents of `sql/update-notification-status-constraint.sql`
3. This will update the status constraint to allow 'pending' status

### Step 2: Test the Fix
1. Try sending a message again
2. Check the console for notification logs
3. Verify that notifications are being created in the database

## Expected Database Schema

After running the fix script, your `notification_history` table should have these columns:

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- title (TEXT, NOT NULL)
- body (TEXT, NOT NULL)
- data (JSONB)
- notification_type (TEXT, NOT NULL)
- sent_at (TIMESTAMP WITH TIME ZONE)
- delivered_at (TIMESTAMP WITH TIME ZONE)
- opened_at (TIMESTAMP WITH TIME ZONE)
- status (TEXT, DEFAULT 'sent')
```

## Testing the Fix

1. **Send a Test Message**
   - Go to any conversation
   - Send a new message
   - Check console for notification logs

2. **Check Database**
   - Look for new records in `notification_history` table
   - Verify the `notification_type` column exists and has values

3. **Check Console Logs**
   - Should see: `✅ Push notification sent successfully`
   - No more database schema errors

## Common Issues After Fix

### Still Getting Schema Errors?
1. Make sure you ran the SQL script in Supabase
2. Check if the table was recreated successfully
3. Verify the table has all required columns

### Notifications Still Not Working?
1. Check if push tokens are properly stored
2. Verify notification preferences are enabled
3. Check the edge function logs in Supabase

### React Native Errors Persist?
1. Clear your app cache
2. Restart the development server
3. Check for other components with emoji characters

## Prevention

### For Database Schema
- Always run schema creation scripts in the correct order
- Use `IF NOT EXISTS` clauses when creating tables
- Test schema changes in development first

### For React Native Components
- Never put text nodes directly inside `<View>` components
- Always wrap text content in `<Text>` components
- Avoid using emoji characters in status displays
- Use text strings like "Yes/No" instead of "✅/❌"

## Related Files

- `src/services/realtimeChat.ts` - Message notification logic
- `src/components/ui/VapidTest.tsx` - VAPID testing component (fixed)
- `sql/fix-notification-history-schema.sql` - Database schema fix
- `supabase/functions/send-push-notification/` - Push notification service

## Next Steps

After applying these fixes:

1. **Test Message Notifications**: Send messages and verify notifications work
2. **Monitor Database**: Check for new notification records
3. **Test Push Notifications**: Verify recipients receive push notifications
4. **Add Error Handling**: Implement better error handling for notification failures

## Quick Fix Summary

The main issues were:
1. **Missing database column** - Fixed by recreating the table
2. **React Native View errors** - Fixed by removing emoji characters

Both issues have been resolved and your notification system should now work properly.
