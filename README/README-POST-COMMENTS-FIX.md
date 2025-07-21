# Post Comments Foreign Key Fix

## 🚨 Issue Description

The error `PGRST200` indicates that Supabase is looking for a foreign key relationship between `post_comments` and `profiles` tables, but the relationship doesn't exist in the database schema.

**Error Details:**
```
{
    "code": "PGRST200",
    "details": "Searched for a foreign key relationship between 'post_comments' and 'profiles' using the hint 'post_comments_user_id_fkey' in the schema 'public', but no matches were found.",
    "hint": "Perhaps you meant 'posts' instead of 'profiles'.",
    "message": "Could not find a relationship between 'post_comments' and 'profiles' in the schema cache"
}
```

**Additional RLS Policy Error:**
```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy Comments are viewable on public posts on table post_comments depends on column "post_id"
```

## 🔧 Root Cause

The issue occurs because:
1. The `post_comments` table is missing proper foreign key constraints
2. The PostService was trying to use foreign key relationships in SELECT statements
3. The database schema is incomplete or inconsistent
4. **RLS policies are preventing column type alterations**

## ✅ Solution

### Step 1: Fix Database Schema (Updated for RLS)

Run the comprehensive SQL script that handles RLS policies:

```sql
-- Run this in your Supabase SQL Editor
-- File: sql/fix-post-comments-schema-with-rls.sql
```

This script will:
- ✅ Check current table structure and RLS policies
- ✅ **Drop existing RLS policies** to avoid conflicts
- ✅ Drop existing problematic constraints
- ✅ Create proper table structure
- ✅ Add missing columns
- ✅ **Safely alter column types** (after RLS policies are dropped)
- ✅ Create correct foreign key relationships
- ✅ Add performance indexes
- ✅ Create update triggers
- ✅ **Recreate RLS policies** with proper security rules
- ✅ Verify the final structure

### Step 2: Code Changes (Already Applied)

The PostService has been updated to:
- ✅ Remove foreign key relationship references in SELECT statements
- ✅ Use manual user data enrichment instead
- ✅ Handle comments and replies properly
- ✅ Maintain all functionality without schema dependencies

## 🗄️ Database Schema

### Post Comments Table Structure

```sql
CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Foreign Key Relationships

```sql
-- Link to posts table
ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Link to profiles table
ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Self-referencing for replies
ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES post_comments(id) 
ON DELETE CASCADE;
```

### RLS Policies (Recreated)

```sql
-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Comments are viewable on public posts
CREATE POLICY "Comments are viewable on public posts" ON post_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_comments.post_id 
            AND posts.is_public = true
        )
    );

-- Users can view comments on their own posts
CREATE POLICY "Users can view comments on their own posts" ON post_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_comments.post_id 
            AND posts.user_id = auth.uid()
        )
    );

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments" ON post_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_comments.post_id 
            AND (posts.is_public = true OR posts.user_id = auth.uid())
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (
        user_id = auth.uid()
    );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (
        user_id = auth.uid()
    );
```

### Performance Indexes

```sql
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);
```

## 🔄 How It Works Now

### Comment Creation Flow

1. **User submits comment** → PostService.addComment()
2. **Insert into database** → No foreign key relationships in SELECT
3. **Enrich with user data** → Manual getUserData() call
4. **Return enriched comment** → With user_profile included

### Comment Retrieval Flow

1. **Fetch comments** → Simple SELECT without joins
2. **Enrich each comment** → Manual getUserData() for each
3. **Build tree structure** → Organize comments and replies
4. **Return structured data** → Ready for UI rendering

## 🎯 Benefits of This Approach

### ✅ Reliability
- No dependency on foreign key relationships in queries
- Works even if schema changes
- More resilient to database issues
- **Properly handles RLS policies**

### ✅ Performance
- Simpler queries
- Better control over data fetching
- Optimized indexes

### ✅ Flexibility
- Easy to modify user data enrichment
- Can handle missing user profiles gracefully
- Supports complex user data logic

### ✅ Security
- **Maintains RLS policies** for data protection
- Users can only access appropriate comments
- Proper authorization checks

## 🧪 Testing

After applying the fix:

1. **Test comment creation**:
   ```javascript
   await PostService.addComment(postId, userId, "Test comment");
   ```

2. **Test comment retrieval**:
   ```javascript
   const comments = await PostService.getPostComments(postId);
   ```

3. **Test reply creation**:
   ```javascript
   await PostService.addReply(commentId, userId, "Test reply");
   ```

4. **Test GIF/sticker comments**:
   ```javascript
   await PostService.addComment(postId, userId, "Check this out! [GIF: https://...]");
   ```

5. **Test RLS policies**:
   - Try accessing comments on public posts (should work)
   - Try accessing comments on private posts (should be restricted)
   - Try updating/deleting other users' comments (should be denied)

## 🚀 Next Steps

1. **Run the updated SQL script** in Supabase SQL Editor:
   ```sql
   -- File: sql/fix-post-comments-schema-with-rls.sql
   ```

2. **Test the functionality** in your app
3. **Monitor for any remaining issues**
4. **Update other services** if they have similar problems

## 📝 Notes

- The fix maintains backward compatibility
- No data loss occurs during the process
- The app will work immediately after applying the fix
- All existing comments and replies are preserved
- **RLS policies are properly recreated** with security intact

## 🔍 Troubleshooting

If you still encounter issues:

1. **Check table structure**:
   ```sql
   SELECT * FROM information_schema.columns WHERE table_name = 'post_comments';
   ```

2. **Verify foreign keys**:
   ```sql
   SELECT * FROM information_schema.table_constraints WHERE table_name = 'post_comments';
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'post_comments';
   ```

4. **Test a simple query**:
   ```sql
   SELECT * FROM post_comments LIMIT 1;
   ```

5. **Check for errors** in Supabase logs

## ⚠️ Important Notes

- **Use the RLS-aware script**: `sql/fix-post-comments-schema-with-rls.sql`
- **Don't use the original script** if you have RLS policies
- The script will temporarily drop and recreate RLS policies
- All security rules are preserved in the recreation process

The fix should resolve both the foreign key relationship issues and the RLS policy conflicts, allowing GIF/sticker comments to work properly! 🎉 