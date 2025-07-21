# Birthdate Update Implementation

This document outlines the changes made to update the dating app from using `age` to `birthdate` for better data accuracy and user experience.

## Overview

The app has been updated to store user birthdates instead of ages. This provides several benefits:
- More accurate age calculations
- Better data integrity
- Automatic age updates
- Improved user experience

## Changes Made

### 1. Database Schema Updates

#### Migration File: `sql/update-age-to-birthdate.sql`
- Added `birthdate` column (DATE type) to profiles table
- Removed `age` column
- Added constraints to ensure birthdate is reasonable (18+ years old, not in future)
- Created `calculate_age()` function for age calculations
- Created `profiles_with_age` view for backward compatibility
- Updated indexes

#### Function Update: `sql/update-profile-function-birthdate.sql`
- Updated `simple_create_profile` function to accept `birthdate` instead of `age`
- Updated return type to include `birthdate` field
- Maintained backward compatibility with existing code

### 2. TypeScript Type Updates

#### `src/types/index.ts`
- Updated `Profile` interface to use `birthdate: string` instead of `age: number`
- Birthdate is stored as ISO date string (YYYY-MM-DD format)

#### `src/services/auth.ts`
- Updated `SignUpData` interface to use `birthdate: string`
- Updated all database operations to use birthdate field
- Maintained existing error handling and validation

### 3. New Components

#### `src/components/ui/DatePicker.tsx`
- Cross-platform date picker component
- Supports iOS, Android, and Web
- Includes validation and error handling
- Uses `@react-native-community/datetimepicker` package

#### `src/utils/dateUtils.ts`
- Utility functions for date handling
- `calculateAge()` - Calculate age from birthdate
- `formatDateToISO()` - Format date to ISO string
- `parseISODate()` - Parse ISO string to Date
- `isAtLeast18()` - Check if user is 18+
- `getMinimumBirthdate()` - Get minimum birthdate for 18+ users
- `getMaximumBirthdate()` - Get maximum reasonable birthdate

### 4. Updated Components

#### `src/components/auth/SignupForm.tsx`
- Replaced age input with DatePicker component
- Updated validation logic to use birthdate
- Added proper age calculation and validation
- Improved user experience with date constraints

## Installation Steps

### 1. Install Dependencies
```bash
npm install @react-native-community/datetimepicker
```

### 2. Run Database Migrations
Execute the following SQL files in your Supabase SQL editor in order:

1. `sql/update-age-to-birthdate.sql`
2. `sql/update-profile-function-birthdate.sql`

### 3. Update Existing Data (Optional)
If you have existing users with age data, you can update them:

```sql
-- Update existing profiles with estimated birthdate
UPDATE profiles 
SET birthdate = DATE_TRUNC('year', NOW()) - INTERVAL '25 years'
WHERE birthdate IS NULL;
```

## Usage Examples

### Using the DatePicker Component
```tsx
import { DatePicker } from '../ui/DatePicker';

<DatePicker
  placeholder="Select your birthdate"
  value={birthdate}
  onChange={setBirthdate}
  error={errors.birthdate}
  maximumDate={getMinimumBirthdate()} // 18 years ago
  minimumDate={getMaximumBirthdate()} // 100 years ago
/>
```

### Using Date Utilities
```tsx
import { calculateAge, formatDateToISO, isAtLeast18 } from '../utils/dateUtils';

// Calculate age
const age = calculateAge(birthdate);

// Format date for API
const isoDate = formatDateToISO(birthdate);

// Validate age
const isValid = isAtLeast18(birthdate);
```

## Validation Rules

- Users must be at least 18 years old
- Birthdate cannot be in the future
- Maximum age limit of 100 years
- Birthdate is required during signup

## Backward Compatibility

- Created `profiles_with_age` view for existing queries
- `calculate_age()` function available for age calculations
- Existing code can be gradually migrated

## Testing

### Manual Testing
1. Test signup flow with valid birthdate
2. Test validation with underage birthdate
3. Test validation with future birthdate
4. Test cross-platform date picker behavior

### Database Testing
```sql
-- Test age calculation
SELECT calculate_age('1990-05-15');

-- Test view
SELECT * FROM profiles_with_age LIMIT 5;

-- Test constraints
INSERT INTO profiles (user_id, first_name, last_name, birthdate, gender)
VALUES (gen_random_uuid(), 'Test', 'User', '2010-01-01', 'Other');
-- Should fail due to age constraint
```

## Migration Notes

- Existing age data will be lost during migration
- Consider backing up existing data before migration
- Update any hardcoded age references in your application
- Test thoroughly in staging environment before production

## Future Enhancements

- Add age display in user profiles
- Implement age-based filtering in discovery
- Add birthday notifications
- Consider timezone handling for international users

## Troubleshooting

### Common Issues

1. **DatePicker not showing on Android**
   - Ensure `@react-native-community/datetimepicker` is properly installed
   - Check platform-specific styling

2. **Database function errors**
   - Verify SQL migration was executed successfully
   - Check function permissions in Supabase

3. **Age calculation discrepancies**
   - Use `calculateAge()` utility function consistently
   - Consider timezone differences

### Support

For issues related to this update, check:
- Supabase documentation for date handling
- React Native DateTimePicker documentation
- Existing error logs and console output 