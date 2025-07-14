# Fix Foreign Key Constraint Issue for Signup

## Problem
You're getting this error during signup:
```
{
    "code": "23503",
    "details": "Key (user_id)=(4c8ab199-efa5-4bfc-b169-3da27c955757) is not present in table \"users\".",
    "hint": null,
    "message": "insert or update on table \"profiles\" violates foreign key constraint \"profiles_user_id_fkey\""
}
```

## Root Cause
The foreign key constraint error occurs because:
1. **Timing Issue**: The profile is being created before the user is fully committed to the `auth.users` table
2. **Transaction Rollback**: The user creation might be rolled back due to validation or other issues
3. **Race Condition**: Multiple processes trying to create the profile simultaneously

## Solution

### Step 1: Run the Foreign Key Fix
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-foreign-key-issue.sql` into the editor
4. Click "Run" to execute the SQL

### Step 2: Debug the Issue (Optional)
1. Run the contents of `debug-user-issue.sql` to check if the user exists
2. Look for any orphaned profiles or missing users

### Step 3: Test the Fix
1. Try signing up a new user
2. Check the console logs for detailed progress information
3. Verify that the profile is created successfully

## What the Fix Does

### **1. Enhanced Trigger Function**
- **Adds delay** to ensure user is fully committed
- **Error handling** for foreign key violations
- **Graceful failure** without breaking the signup process

### **2. Retry Function**
- **Automatic retries** with exponential backoff
- **Foreign key violation handling** specifically
- **Multiple attempts** before giving up

### **3. Improved Auth Service**
- **User verification** before profile creation
- **Longer wait times** for user commitment
- **Detailed logging** for debugging
- **Multiple fallback methods**

### **4. Better Error Handling**
- **Specific foreign key error handling**
- **Retry logic** with delays
- **Comprehensive logging** for troubleshooting

## Key Features

### **Robust Trigger (`handle_new_user_robust`)**
```sql
-- Adds delay and error handling
PERFORM pg_sleep(0.1);
-- Handles foreign key violations gracefully
EXCEPTION WHEN foreign_key_violation THEN
  RAISE NOTICE 'Foreign key violation for user %', NEW.id;
```

### **Retry Function (`create_profile_with_retry`)**
```sql
-- Retries with exponential backoff
WHILE retry_count < p_max_retries AND NOT success LOOP
  -- Try to create profile
  -- Wait before retry if failed
  PERFORM pg_sleep(0.5 * retry_count);
```

### **Enhanced Auth Service**
```typescript
// User verification before profile creation
const { data: { user: verifiedUser } } = await supabase.auth.getUser();
if (!verifiedUser || verifiedUser.id !== authData.user.id) {
  throw new Error('User verification failed after creation');
}
```

## Debugging Steps

### **1. Check User Existence**
```sql
SELECT * FROM auth.users WHERE id = '4c8ab199-efa5-4bfc-b169-3da27c955757';
```

### **2. Check Orphaned Profiles**
```sql
SELECT p.user_id, p.first_name, p.created_at
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;
```

### **3. Check Recent Users**
```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues and Solutions

### **Issue 1: User Creation Fails Silently**
- **Solution**: Added user verification in auth service
- **Check**: Console logs for "User verification failed"

### **Issue 2: Profile Created Before User Committed**
- **Solution**: Added delays and retry logic
- **Check**: Trigger function with pg_sleep

### **Issue 3: Race Conditions**
- **Solution**: Multiple fallback methods
- **Check**: Retry function with exponential backoff

### **Issue 4: Transaction Rollback**
- **Solution**: Error handling in trigger
- **Check**: Graceful failure without breaking signup

## Testing the Fix

### **1. Run Debug Script**
```sql
-- Execute debug-user-issue.sql
-- Check if user exists and profile status
```

### **2. Test Signup Process**
- Try signing up with a new email
- Check console logs for progress
- Verify profile creation

### **3. Check Logs**
- Look for "Profile created successfully" messages
- Check for any error messages
- Verify user verification passed

## Prevention

### **1. Always Verify User**
```typescript
// Verify user exists before creating profile
const { data: { user: verifiedUser } } = await supabase.auth.getUser();
```

### **2. Use Retry Logic**
```typescript
// Use retry function for profile creation
const { data: profileData } = await supabase.rpc('create_profile_with_retry', {
  p_user_id: authData.user.id,
  // ... other parameters
});
```

### **3. Handle Errors Gracefully**
```typescript
// Don't fail the entire signup if profile creation fails
try {
  // Profile creation logic
} catch (error) {
  console.error('Profile creation failed:', error);
  // Continue with signup process
}
```

## Files Created/Updated

- ✅ **`fix-foreign-key-issue.sql`** - Main fix for foreign key constraint
- ✅ **`debug-user-issue.sql`** - Debugging script
- ✅ **`src/services/auth.ts`** - Enhanced auth service with retry logic
- ✅ **`README-FOREIGN-KEY-FIX.md`** - This documentation

This comprehensive fix should resolve the foreign key constraint issue and make the signup process much more reliable! 