# Free Plan Photo Storage Guide

## Overview

This dating app is designed to work with both free and paid Supabase plans. When using the free plan, photos are stored as base64 data URLs directly in the database instead of using Supabase Storage.

## How It Works

### Free Plan (Base64 Storage)
- Photos are converted to base64 data URLs
- Stored directly in the `profiles.photos` column as an array of strings
- No external storage bucket required
- Works immediately with any Supabase project
- Limited by database row size (1MB per photo recommended)

### Paid Plan (Supabase Storage)
- Photos are uploaded to a Supabase Storage bucket
- Stored as files in the `profile-photos` bucket
- Better performance and scalability
- Requires storage bucket setup

## Automatic Detection

The app automatically detects your plan type and chooses the appropriate storage method:

1. **Tests Supabase Storage availability**
2. **Falls back to base64 if storage is not available**
3. **Shows appropriate success messages**

## Testing Your Setup

Use the "Test Storage" button in the profile screen to check your current configuration:

- **Green checkmark**: Storage is working properly
- **Base64 fallback**: Free plan - photos will be stored as base64
- **Supabase Storage**: Paid plan - photos will be stored in storage bucket

## Database Schema

The `profiles` table includes a `photos` column that stores an array of strings:

```sql
photos TEXT[] -- Array of photo URLs or base64 data URLs
```

## File Size Limits

### Free Plan (Base64)
- **Recommended**: 500KB per photo
- **Maximum**: 1MB per photo
- **Total**: Limited by database row size

### Paid Plan (Storage)
- **Recommended**: 5MB per photo
- **Maximum**: 50MB per photo (configurable)

## Performance Considerations

### Free Plan
- ✅ No setup required
- ✅ Works immediately
- ❌ Larger database size
- ❌ Slower photo loading
- ❌ Limited by database constraints

### Paid Plan
- ✅ Better performance
- ✅ Scalable storage
- ✅ CDN delivery
- ❌ Requires setup
- ❌ Additional cost

## Migration

If you upgrade from free to paid plan:

1. **Photos remain as base64** - no automatic migration
2. **New photos use storage** - automatically detected
3. **Manual migration possible** - re-upload photos to use storage

## Troubleshooting

### Common Issues

1. **"Storage not available" error**
   - Normal for free plan
   - App will use base64 storage automatically

2. **"Image too large" error**
   - Reduce image quality or size
   - Free plan: Keep under 1MB
   - Paid plan: Keep under 50MB

3. **"Permission denied" error**
   - Check Supabase Storage policies
   - Ensure bucket exists and is accessible

### Testing Commands

Run these in your Supabase SQL editor to check your setup:

```sql
-- Check if storage is available
SELECT * FROM storage.buckets WHERE name = 'profile-photos';

-- Check profile photos
SELECT id, first_name, array_length(photos, 1) as photo_count 
FROM profiles 
WHERE photos IS NOT NULL;
```

## Best Practices

### For Free Plan Users
- Use compressed images (0.8 quality)
- Keep photos under 500KB
- Limit to 3-5 photos per profile
- Use 3:4 aspect ratio for consistency

### For Paid Plan Users
- Set up storage bucket properly
- Configure RLS policies
- Use appropriate file size limits
- Monitor storage usage

## Support

If you encounter issues:

1. **Test your storage connection** using the profile screen
2. **Check the console logs** for detailed error messages
3. **Verify your Supabase project settings**
4. **Contact support** if problems persist

The app is designed to work seamlessly with both plans, automatically adapting to your current setup. 