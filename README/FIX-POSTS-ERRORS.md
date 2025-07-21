# Fix PGRST200 Posts Errors - Step by Step Guide

## Problem
You're getting PGRST200 errors because the posts table is missing from your Supabase database:
```
ERROR: Could not find a relationship between 'posts' and 'profiles' in the schema cache
```

## Solution
You need to run the SQL script in your Supabase database to create the missing tables.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor
1. In your Supabase project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New query"** to create a new SQL query

### Step 3: Copy and Paste the SQL Script
Copy the entire content from `sql/fix-posts-schema.sql` and paste it into the SQL editor:

```sql
-- Fix Posts Table Schema
-- This script adds the missing posts table with proper foreign key relationships

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  location TEXT,
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table for tracking post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table for tracking post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view public posts" ON posts
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for posts updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_posts_updated_at();

-- Create trigger for post_comments updated_at
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_posts_updated_at();

-- Create function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post likes count
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Create function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post comments count
CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Add foreign key constraint to conversations table for last_message_id
ALTER TABLE conversations 
ADD CONSTRAINT IF NOT EXISTS conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Update the database schema cache
NOTIFY pgrst, 'reload schema';
```

### Step 4: Run the SQL Script
1. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for the script to complete
3. You should see success messages for each table creation

### Step 5: Verify the Tables Were Created
Run this verification query in the SQL editor:

```sql
-- Check that tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('posts', 'post_likes', 'post_comments');
```

You should see:
```
table_name
----------
posts
post_likes
post_comments
```

### Step 6: Test Post Creation
Run this test query to verify post creation works:

```sql
-- Test post creation (replace with your user ID)
INSERT INTO posts (user_id, content, is_public) 
VALUES ('your-user-id-here', 'Test post', true)
RETURNING id, content, created_at;
```

### Step 7: Restart Your App
1. Stop your development server (Ctrl+C)
2. Restart your app: `npm start` or `expo start`
3. Try creating a post again

## Alternative: Quick Fix Script
If you want a minimal version that just creates the essential tables:

```sql
-- Minimal posts table creation
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  location TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view public posts" ON posts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Reload schema
NOTIFY pgrst, 'reload schema';
```

## Troubleshooting

### If you get permission errors:
- Make sure you're logged in as the project owner or have admin privileges
- Check that your Supabase project is active

### If tables already exist:
- The `IF NOT EXISTS` clauses will prevent errors
- The script will skip existing tables

### If you still get PGRST200 errors:
- Wait a few minutes for the schema cache to update
- Try refreshing your app
- Check that the tables were actually created in the Supabase dashboard

## Expected Results
After running the script:
- ✅ Posts can be created without errors
- ✅ Posts can be fetched without errors
- ✅ No more PGRST200 errors
- ✅ Full post functionality works

The PGRST200 errors should be completely resolved once you run this SQL script in your Supabase database! 