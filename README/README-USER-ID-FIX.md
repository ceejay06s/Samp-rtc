# Fix User ID Relationship Issue

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
The issue is that `profiles.user_id` is a foreign key that references `auth.users.id`, but:
1. **Timing Issue**: The profile is being created before the user is fully committed to `auth.users`
2. **Transaction Rollback**: The user creation might be rolled back silently
3. **Constraint Timing**: The foreign key constraint is checked immediately, not deferred

## Solution

### Step 1: Run the User ID Relationship Fix
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-user-id-relationship.sql` into the editor
4. Click "Run" to execute the SQL

### Step 2: Check the Current Setup (Optional)
1. Run the contents of `check-foreign-key.sql` to understand the current constraint
2. Verify the relationship between `profiles.user_id` and `auth.users.id`

### Step 3: Test the Fix
1. Try signing up a new user
2. Check console logs for detailed progress
3. Verify that the profile is created successfully

## What the Fix Does

### **1. Deferred Foreign Key Constraint**
```sql
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;
```
- **DEFERRABLE INITIALLY DEFERRED**: Constraint is checked at the end of the transaction
- **ON DELETE CASCADE**: Automatically deletes profile when user is deleted

### **2. User Existence Verification**
```sql
-- First, verify the user exists in auth.users
SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;

IF NOT user_exists THEN
  RAISE EXCEPTION 'User with ID % does not exist in auth.users table', p_user_id;
END IF;
```
- **Explicit check** for user existence before creating profile
- **Clear error message** if user doesn't exist

### **3. Commit Check Trigger**
```sql
-- Wait for user to be committed to auth.users
WHILE retry_count < max_retries LOOP
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = NEW.id) INTO user_exists;
  
  IF user_exists THEN
    -- User exists, create profile
    -- ... profile creation logic
    EXIT; -- Exit the retry loop
  ELSE
    -- User doesn't exist yet, wait and retry
    retry_count := retry_count + 1;
    PERFORM pg_sleep(0.2 * retry_count); -- Exponential backoff
  END IF;
END LOOP;
```
- **Retry logic** with exponential backoff
- **Waits for user commitment** before creating profile
- **Graceful handling** of timing issues

### **4. Enhanced Auth Service**
```typescript
// User verification before profile creation
const { data: { user: verifiedUser } } = await supabase.auth.getUser();
if (!verifiedUser || verifiedUser.id !== authData.user.id) {
  throw new Error('User verification failed after creation');
}
```
- **Double verification** of user existence
- **Multiple fallback methods** for profile creation
- **Detailed logging** for debugging

## Key Features

### **Deferred Constraint**
- **DEFERRABLE INITIALLY DEFERRED**: Allows the constraint to be checked at transaction end
- **Prevents immediate failures** due to timing issues
- **Maintains data integrity** while allowing flexibility

### **User Verification Function**
```sql
CREATE OR REPLACE FUNCTION create_profile_safe_with_user_check(
  p_user_id UUID,
  p_first_name TEXT DEFAULT 'User',
  p_last_name TEXT DEFAULT '',
  p_age INTEGER DEFAULT 18,
  p_gender TEXT DEFAULT 'Other'
) RETURNS profiles AS $$
```
- **Explicit user existence check** before profile creation
- **Clear error messages** for debugging
- **SECURITY DEFINER** to bypass RLS issues

### **Commit Check Trigger**
```sql
CREATE TRIGGER on_auth_user_created_with_commit_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_commit_check();
```
- **Waits for user commitment** before creating profile
- **Retry logic** with exponential backoff
- **Graceful error handling**

## Why This Approach Works

### **1. Addresses Timing Issues**
- **Deferred constraint** allows user to be committed first
- **Retry logic** handles race conditions
- **Explicit verification** ensures user exists

### **2. Maintains Data Integrity**
- **Foreign key constraint** still enforced
- **Cascade deletes** maintain referential integrity
- **User verification** prevents orphaned profiles

### **3. Provides Multiple Fallbacks**
- **Trigger-based** automatic profile creation
- **Function-based** manual profile creation
- **Direct insert** as last resort

### **4. Better Error Handling**
- **Clear error messages** for debugging
- **Graceful failures** without breaking signup
- **Comprehensive logging** for troubleshooting

## Testing the Fix

### **1. Check Foreign Key Constraint**
```sql
-- Run check-foreign-key.sql
-- Verify the constraint is properly set up
```

### **2. Test User Creation**
- Try signing up with a new email
- Check that user is created in `auth.users`
- Verify profile is created in `profiles`

### **3. Test Error Scenarios**
- Try creating profile for non-existent user
- Check error messages are clear and helpful
- Verify retry logic works

## Debugging Steps

### **1. Check User Existence**
```sql
SELECT * FROM auth.users WHERE id = '4c8ab199-efa5-4bfc-b169-3da27c955757';
```

### **2. Check Foreign Key Constraint**
```sql
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles'
  AND kcu.column_name = 'user_id';
```

### **3. Check Orphaned Profiles**
```sql
SELECT p.user_id, p.first_name, p.created_at
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;
```

## Files Created/Updated

- ✅ **`fix-user-id-relationship.sql`** - Main fix for user ID relationship
- ✅ **`check-foreign-key.sql`** - Debugging script for foreign key constraints
- ✅ **`src/services/auth.ts`** - Enhanced auth service with user verification
- ✅ **`README-USER-ID-FIX.md`** - This documentation

This fix properly addresses the relationship between `profiles.user_id` and `auth.users.id` by ensuring the user exists before creating the profile and using deferred constraints to handle timing issues! 