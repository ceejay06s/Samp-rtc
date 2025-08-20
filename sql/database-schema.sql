-- Dating App Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  bio TEXT,
  age INTEGER NOT NULL CHECK (age >= 18),
  gender TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  photos TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  max_distance INTEGER DEFAULT 50 CHECK (max_distance > 0),
  min_age INTEGER DEFAULT 18 CHECK (min_age >= 18),
  max_age INTEGER DEFAULT 100 CHECK (max_age <= 100),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  last_message_id UUID,
  unread_count INTEGER DEFAULT 0 CHECK (unread_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'voice')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Voice calls table
CREATE TABLE voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER CHECK (duration >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_like BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Interests table (for predefined interests)
CREATE TABLE interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interests junction table
CREATE TABLE user_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

-- Posts table
CREATE TABLE posts (
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

-- Post likes table
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match interactions table (for tracking engagement)
CREATE TABLE match_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('message', 'photo', 'voice_message', 'voice_call')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_profiles_online ON profiles(is_online);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_active ON matches(is_active);
CREATE INDEX idx_matches_level ON matches(level);

CREATE INDEX idx_conversations_match_id ON conversations(match_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_voice_calls_match_id ON voice_calls(match_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at);

CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_public ON posts(is_public);
CREATE INDEX idx_posts_location ON posts(location);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);

CREATE INDEX idx_match_interactions_match_id ON match_interactions(match_id);
CREATE INDEX idx_match_interactions_user_id ON match_interactions(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_interactions ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security for posts tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles for discovery" ON profiles
  FOR SELECT USING (auth.uid() != user_id);

-- Matches policies
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Conversations policies
CREATE POLICY "Users can view conversations for their matches" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = conversations.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update conversations for their matches" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = conversations.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert conversations for their matches" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = conversations.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON c.match_id = m.id
      WHERE c.id = messages.conversation_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON c.match_id = m.id
      WHERE c.id = messages.conversation_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Voice calls policies
CREATE POLICY "Users can view their voice calls" ON voice_calls
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert voice calls" ON voice_calls
  FOR INSERT WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update their voice calls" ON voice_calls
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Likes policies
CREATE POLICY "Users can view their likes" ON likes
  FOR SELECT USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can insert their likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete their likes" ON likes
  FOR DELETE USING (auth.uid() = liker_id);

-- User interests policies
CREATE POLICY "Users can view their interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their interests" ON user_interests
  FOR ALL USING (auth.uid() = user_id);

-- Match interactions policies
CREATE POLICY "Users can view interactions for their matches" ON match_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = match_interactions.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their interactions" ON match_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts policies
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

-- Post likes policies
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own post comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for posts tables
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post likes count
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

-- Function to update post comments count
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

-- Create triggers for post counts
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to create conversation when match is created
CREATE OR REPLACE FUNCTION create_conversation_for_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversations (match_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create conversation when match is created
CREATE TRIGGER create_conversation_on_match_insert
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION create_conversation_for_match();

-- Function to update conversation when message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update conversation when message is sent
CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Insert some sample interests
INSERT INTO interests (name, category, icon) VALUES
('hiking', 'outdoor', '🏔️'),
('coffee', 'food', '☕'),
('travel', 'lifestyle', '✈️'),
('music', 'entertainment', '🎵'),
('art', 'creative', '🎨'),
('photography', 'creative', '📸'),
('cooking', 'food', '👨‍🍳'),
('reading', 'lifestyle', '📚'),
('gaming', 'entertainment', '🎮'),
('fitness', 'health', '💪'),
('yoga', 'health', '🧘'),
('dancing', 'entertainment', '💃'),
('writing', 'creative', '✍️'),
('gardening', 'outdoor', '🌱'),
('volunteering', 'lifestyle', '🤝');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 