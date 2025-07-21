# Comment Reactions Table Fix

## Issue
The app is showing this error:
```
{code: '42P01', details: null, hint: null, message: 'relation "public.comment_reactions" does not exist'}
```

This happens because the `comment_reactions` table hasn't been created in your Supabase database yet.

## Solution

### Option 1: Safe Setup (Recommended)
Use the safe setup script that handles existing tables and policies:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql/safe-comment-reactions-setup.sql`
4. Click **Run** to execute the SQL

### Option 2: Standard Setup
If you prefer the standard setup:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql/run-comment-reactions-setup.sql`
4. Click **Run** to execute the SQL

**Note**: If you get policy errors like "policy already exists", use the **Safe Setup** option instead.

### Step 2: Verify the Setup
After running the SQL, you should see:
- `comment_reactions setup completed successfully`
- `table_count: 1`
- `policy_count: 3`
- `function_count: 2`

### What the SQL Creates

#### Table: `comment_reactions`
- Stores user reactions to comments (likes, emojis, etc.)
- Links to `post_comments` and `auth.users` tables
- Has Row Level Security (RLS) policies for data protection

#### Functions:
- `get_comment_reaction_counts(comment_ids UUID[])` - Gets reaction counts for comments
- `get_user_comment_reactions(comment_ids UUID[], user_uuid UUID)` - Checks if user has reacted to comments

#### RLS Policies:
- Users can view all comment reactions
- Users can only insert their own reactions
- Users can only delete their own reactions

### Features Enabled
After running this SQL, the following features will work:

✅ **Comment Reactions** - Users can like comments  
✅ **Reaction Counts** - Shows how many likes each comment has  
✅ **User Reaction Status** - Shows if the current user has liked a comment  
✅ **Emoji Reactions** - Users can add emoji reactions to comments  

### Error Handling
The app has been updated with error handling, so it won't crash if the table doesn't exist yet. It will gracefully continue without comment reactions until the table is created.

### Troubleshooting

#### Policy Already Exists Error
If you see this error:
```
ERROR: 42710: policy "Users can view all comment reactions" for table "comment_reactions" already exists
```

**Solution**: Use the **Safe Setup** script (`sql/safe-comment-reactions-setup.sql`) which handles existing policies gracefully.

#### Table Already Exists Error
If you see this error:
```
ERROR: 42P07: relation "comment_reactions" already exists
```

**Solution**: Use the **Safe Setup** script which checks if the table exists before creating it.

### Testing
After running the SQL:
1. Create a post
2. Add a comment
3. Try liking the comment
4. Check if the reaction count updates

The comment reactions should now work properly! 