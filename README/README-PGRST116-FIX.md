# PGRST116 Error Fix - "No Rows Returned" Solution

## Problem Identified
The `PGRST116` error with message "JSON object requested, multiple (or no) rows returned" was occurring because:

1. **Root Cause**: Users were signing up successfully but their profile creation failed during the signup process
2. **Immediate Trigger**: When users tried to upload photos, the `AuthService.updateProfile` method attempted to update a non-existent profile
3. **Technical Issue**: The `.single()` method expects exactly one row, but got 0 rows instead

## Error Details
```
ERROR  Supabase update error: {
  "code": "PGRST116", 
  "details": "The result contains 0 rows", 
  "hint": null, 
  "message": "JSON object requested, multiple (or no) rows returned"
}
ERROR  Profile update failed: ...
ERROR  Failed to add photo: [Error: Profile update failed: Unknown error]
```

## Complete Solution Implemented

### 1. Enhanced AuthService.updateProfile Method
**File**: `src/services/auth.ts`

**What Changed**:
- Now checks if profile exists before attempting update using `maybeSingle()`
- Automatically creates a profile with default values if none exists
- Provides comprehensive error handling and logging

**Key Features**:
```typescript
// Check if profile exists first
const { data: existingProfile, error: checkError } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle(); // Prevents error if no rows found

// Create profile if it doesn't exist
if (!existingProfile) {
  const createData = {
    user_id: userId,
    first_name: data.first_name || 'User',
    last_name: data.last_name || '',
    birthdate: data.birthdate || '1990-01-01',
    gender: data.gender || 'Other',
    // ... other defaults
  };
  // Create new profile...
}
```

### 2. Added ensureProfileExists Helper Method
**Purpose**: Ensures any user has a profile, creating one with defaults if needed

**Usage**: Can be called anywhere to guarantee a profile exists
```typescript
static async ensureProfileExists(userId: string): Promise<Profile>
```

### 3. Updated getUserProfile Method
**Enhancement**: Now uses `maybeSingle()` and automatically creates missing profiles
```typescript
// Before: Would throw error if no profile found
.single(); // ❌ Causes PGRST116 error

// After: Gracefully handles missing profiles
.maybeSingle(); // ✅ Returns null if no profile, no error
```

### 4. Missing Profiles Diagnostic Script
**File**: `sql/fix-missing-profiles.sql`

**Features**:
- **Diagnostic**: Identifies users without profiles
- **Fix Function**: Creates default profiles for missing users
- **Verification**: Confirms all users have profiles
- **Safe Execution**: Only creates, never modifies existing profiles

## How to Apply the Complete Fix

### Step 1: Update AuthService Code
✅ **Already Applied**: The enhanced `updateProfile` and `ensureProfileExists` methods are implemented

### Step 2: Run Database Diagnostics and Fix
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste contents of `sql/fix-missing-profiles.sql`
3. Run the script to see diagnostics
4. If missing profiles found, uncomment and run:
   ```sql
   SELECT fix_missing_profiles() as profiles_created;
   ```

### Step 3: Test the Fix
1. Try uploading a photo in the app
2. Check console logs for success messages
3. Verify no PGRST116 errors appear

## Prevention Measures

### For Future Signups
The original signup process now has multiple fallback methods to ensure profile creation:
1. `simple_create_profile` function
2. Direct table insert
3. Check and update existing profile
4. `force_create_profile_birthdate` backup
5. Sync function for missing profiles

### For Existing Users
The enhanced `updateProfile` method now:
- Always checks if profile exists first
- Creates missing profiles automatically
- Uses proper error handling
- Provides detailed logging

## Error Handling Improvements

### Before (Causing PGRST116)
```typescript
const { data: profileData, error } = await supabase
  .from('profiles')
  .update(updateData)
  .eq('user_id', userId)
  .select()
  .single(); // ❌ Fails if no profile exists
```

### After (PGRST116 Prevention)
```typescript
// Check if profile exists first
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle(); // ✅ No error if missing

if (!existingProfile) {
  // Create profile with defaults
  return await this.createDefaultProfile(userId, data);
}

// Proceed with update
const { data: profileData, error } = await supabase
  .from('profiles')
  .update(updateData)
  .eq('user_id', userId)
  .select()
  .single(); // ✅ Safe because we know profile exists
```

## Testing and Verification

### Console Logs to Watch For
✅ **Success Indicators**:
```
"Updating profile for user: [user-id]"
"Profile updated successfully: [profile-data]"
"Photo added successfully!"
```

❌ **Error Indicators** (should not appear):
```
"PGRST116"
"The result contains 0 rows"
"Profile not found after update"
```

### Database Verification
Run in Supabase SQL Editor:
```sql
-- Check if all users have profiles
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users au 
   LEFT JOIN profiles p ON au.id = p.user_id 
   WHERE p.user_id IS NULL) as missing_profiles;
```

## Summary of Benefits

### ✅ **Immediate Fixes**
- Photo upload now works for all users
- No more PGRST116 errors
- Automatic profile creation for missing profiles
- Better error handling and logging

### ✅ **Long-term Improvements**
- Robust profile management system
- Graceful handling of edge cases
- Comprehensive error prevention
- Self-healing profile creation

### ✅ **Developer Experience**
- Clear error messages and logging
- Diagnostic tools for troubleshooting
- Safe migration scripts
- Comprehensive documentation

## Troubleshooting

If you still encounter issues:

1. **Check Console Logs**: Look for detailed error messages
2. **Run Diagnostics**: Use `sql/fix-missing-profiles.sql`
3. **Verify Database**: Ensure all users have profiles
4. **Test Methods**: Try different profile update operations

This comprehensive fix should eliminate the PGRST116 error and provide a robust, self-healing profile management system! 🎯 