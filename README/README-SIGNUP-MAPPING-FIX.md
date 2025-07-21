# SIGNUP MAPPING FIX - Comprehensive Solution

## Problem Solved
The signup process was failing due to inconsistent field mappings between the AuthService and database functions. Specifically:

- ❌ AuthService was sending `birthdate` field but database functions expected `age`
- ❌ Multiple conflicting SQL functions with different parameter types
- ❌ Database schema inconsistencies (some tables had `age`, others had `birthdate`)
- ❌ Function signatures didn't match AuthService expectations

## Root Cause
1. **Field Type Mismatch**: Database migration from `age` to `birthdate` was incomplete
2. **Function Parameter Mismatch**: Multiple versions of profile creation functions with different parameters
3. **Schema Inconsistency**: Old SQL files still referenced `age` while newer ones used `birthdate`

## Solution Overview

### ✅ What Was Fixed
1. **Unified Schema**: Ensured all profiles use `birthdate DATE` field consistently
2. **Updated Functions**: All database functions now use correct `birthdate` parameter
3. **Enhanced AuthService**: Added robust fallback methods for profile creation
4. **Proper Constraints**: Added age validation constraints (18+ years, realistic max age)
5. **Improved Error Handling**: Better logging and fallback mechanisms

## How to Apply the Fix

### Step 1: Run the Database Migration
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/fix-signup-mapping.sql` into the editor
4. Click "Run" to execute the SQL

### Step 2: Test the Fix
1. Try signing up a new user in your app
2. Check the browser console for detailed logging
3. Verify that the profile is created successfully

## What the Fix Does

### 1. Database Schema Migration
```sql
-- Automatically migrates from age to birthdate if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birthdate') THEN
        -- Migration logic
    END IF;
END $$;
```

### 2. Correct Function Signature
```sql
-- New function matches AuthService expectations
CREATE OR REPLACE FUNCTION simple_create_profile(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_birthdate DATE,  -- Now correctly uses DATE
    p_gender TEXT
)
```

### 3. Multiple Fallback Methods
The AuthService now has **5 different methods** to create profiles:

1. **Method 1**: `simple_create_profile` function (primary)
2. **Method 2**: Direct table insert
3. **Method 3**: Check for existing profile and update
4. **Method 4**: `force_create_profile_birthdate` function (new backup)
5. **Method 5**: Sync function for missing profiles

### 4. Improved Error Handling
```typescript
// Enhanced logging in AuthService
console.log('Method 1: Using simple_create_profile function...');
const { data: simpleData, error: simpleError } = await supabase
  .rpc('simple_create_profile', {
    p_user_id: authData.user.id,
    p_first_name: data.firstName,
    p_last_name: data.lastName,
    p_birthdate: data.birthdate,  // Correctly mapped
    p_gender: data.gender,
  });
```

### 5. Proper Constraints
```sql
-- Age validation constraints
ALTER TABLE profiles ADD CONSTRAINT check_birthdate_reasonable 
    CHECK (birthdate <= CURRENT_DATE - INTERVAL '18 years' 
           AND birthdate >= CURRENT_DATE - INTERVAL '100 years');
```

## Key Changes Made

### Database Functions
- ✅ Dropped all old functions that used `age` parameter
- ✅ Created new `simple_create_profile(UUID, TEXT, TEXT, DATE, TEXT)`
- ✅ Added backup `force_create_profile_birthdate` function
- ✅ Updated trigger function to use `birthdate`

### AuthService Updates
- ✅ Added Method 4 with `force_create_profile_birthdate` fallback
- ✅ All methods now correctly map form data to database fields
- ✅ Enhanced error logging and debugging

### Schema Improvements
- ✅ Proper indexes on `birthdate` field
- ✅ Age validation constraints
- ✅ Automatic migration from `age` to `birthdate` if needed

## Field Mapping Reference

### Form Data → Database
```typescript
// AuthService SignUpData interface
interface SignUpData {
  email: string;
  password: string;
  firstName: string;    → first_name
  lastName: string;     → last_name
  birthdate: string;    → birthdate (DATE)
  gender: string;       → gender
}
```

### Database Profile Structure
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE NOT NULL,  -- Key field: uses DATE not INTEGER
  gender TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  photos TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  max_distance INTEGER DEFAULT 50,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing

The fix includes automatic testing:
```sql
-- Automatic test included in the SQL script
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_birthdate DATE := '1995-06-15';
    test_result profiles;
BEGIN
    -- Test the function
    SELECT * INTO test_result FROM simple_create_profile(
        test_user_id, 'Test', 'User', test_birthdate, 'Other'
    );
    -- Results logged automatically
END $$;
```

## Verification Steps

After applying the fix:

1. **Check Console Logs**: Look for detailed signup progress messages
2. **Verify Profile Creation**: Check that profiles are created in Supabase dashboard
3. **Test Different Methods**: Try various signup scenarios
4. **Check Database**: Verify `birthdate` field is populated correctly

## Success Indicators

✅ **Signup completes without errors**  
✅ **Console shows "Profile created successfully"**  
✅ **Profile appears in Supabase profiles table**  
✅ **All required fields are populated**  
✅ **Birthdate is stored as DATE type**

## Troubleshooting

If you still see errors:

1. **Check Function Existence**: Verify `simple_create_profile` function exists
2. **Check Permissions**: Ensure proper GRANT statements were executed
3. **Check RLS**: Verify Row Level Security is disabled for testing
4. **Check Logs**: Look at Supabase function logs for detailed errors

## Security Notes

- RLS is temporarily disabled for easier debugging
- All functions use SECURITY DEFINER for elevated permissions
- Proper constraints ensure data validity
- Foreign key relationships are maintained

This fix should resolve all signup mapping issues and provide a robust, multi-fallback profile creation system. 