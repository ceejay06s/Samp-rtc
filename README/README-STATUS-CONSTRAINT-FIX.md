# Notification Status Constraint Fix

## Issue Description
When trying to send a message notification, you're getting this error:

```sql
{
    "code": "23514",
    "details": "Failing row contains (...)",
    "message": "new row for relation \"notification_history\" violates check constraint \"notification_history_status_check\""
}
```

## Root Cause
The `notification_history` table has a constraint that only allows these status values:
- `'sent'`
- `'delivered'` 
- `'opened'`
- `'failed'`

But the code is trying to insert a status value that's not in this list.

## Solution
Update the database constraint to allow the additional status values you need.

## Quick Fix

### Option 1: Update Existing Constraint (Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing constraint
ALTER TABLE notification_history DROP CONSTRAINT IF EXISTS notification_history_status_check;

-- Add the new constraint that includes 'pending'
ALTER TABLE notification_history ADD CONSTRAINT notification_history_status_check 
  CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed'));
```

### Option 2: Use Allowed Status Values
Alternatively, modify your code to only use the currently allowed status values:
- `'sent'` (default)
- `'delivered'`
- `'opened'`
- `'failed'`

## Files to Run
1. **First**: `sql/fix-notification-history-schema.sql` (if table schema is wrong)
2. **Then**: `sql/update-notification-status-constraint.sql` (to fix constraint)

## Testing
After applying the fix:
1. Send a new message
2. Check console for notification logs
3. Verify no more constraint errors
4. Check `notification_history` table for new records

## Prevention
- Always check database constraints before inserting data
- Use consistent status values across your application
- Document allowed status values in your code
- Test database operations with various data values

## Related Files
- `src/services/realtimeChat.ts` - Message notification logic
- `sql/update-notification-status-constraint.sql` - Constraint fix script
- `sql/fix-notification-history-schema.sql` - Schema fix script
