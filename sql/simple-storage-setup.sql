-- Simple Supabase Storage Setup
-- Run this in your Supabase SQL Editor

-- Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photo', 'profile-photo', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('telegram-stickers', 'telegram-stickers', true, 52428800, ARRAY['image/webp', 'image/png', 'image/gif']),
  ('user-uploads', 'user-uploads', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'text/plain', 'application/pdf', 'text/csv']),
  ('chat-media', 'chat-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create basic policies for profile-photo bucket
CREATE POLICY "Profile photos are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photo');

CREATE POLICY "Users can upload profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update profile photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete profile photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photo' AND auth.role() = 'authenticated');

-- Create basic policies for telegram-stickers bucket
CREATE POLICY "Telegram stickers are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'telegram-stickers');

CREATE POLICY "Users can upload stickers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update stickers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete stickers" ON storage.objects
  FOR DELETE USING (bucket_id = 'telegram-stickers' AND auth.role() = 'authenticated');

-- Create basic policies for user-uploads bucket
CREATE POLICY "User uploads are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

-- Create basic policies for chat-media bucket
CREATE POLICY "Chat media is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update chat media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete chat media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-media' AND auth.role() = 'authenticated'); 