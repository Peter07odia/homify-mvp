-- ============================================================
-- HOMIFY FIXED MIGRATION - Handles Existing Policies
-- ============================================================
-- This migration handles cases where storage policies already exist
-- ============================================================

-- Create the room_jobs table with ALL required fields
CREATE TABLE IF NOT EXISTS public.room_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- for user association (nullable for anonymous users)
  original_path TEXT, -- path to original image in storage
  empty_path TEXT, -- path to empty room image in storage
  clean_path TEXT, -- path to clean room image in storage (premium feature)
  styled_path TEXT, -- path to styled room image in storage
  status TEXT DEFAULT 'processing', -- processing, done, error
  room_type TEXT DEFAULT 'living_room', -- living_room, bedroom, kitchen, etc.
  applied_style TEXT, -- modern, minimal, bohemian, etc.
  quality_level TEXT DEFAULT 'standard', -- standard, premium, ultra
  custom_prompt TEXT, -- for custom styling prompts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments for documentation
COMMENT ON COLUMN public.room_jobs.room_type IS 'Type of room: living_room, bedroom, kitchen, bathroom, dining_room, office';
COMMENT ON COLUMN public.room_jobs.applied_style IS 'Design style applied: minimal, modern, bohemian, scandinavian, industrial, botanical, farmhouse, midcentury, luxury, coastal';
COMMENT ON COLUMN public.room_jobs.quality_level IS 'Processing quality: standard, premium, ultra';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_jobs_user_id ON public.room_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_room_jobs_status ON public.room_jobs(status);
CREATE INDEX IF NOT EXISTS idx_room_jobs_created_at ON public.room_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_room_jobs_room_type ON public.room_jobs(room_type);

-- Set up Row Level Security (RLS)
ALTER TABLE public.room_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that work for both authenticated and anonymous users
DROP POLICY IF EXISTS "Allow all operations for development" ON public.room_jobs;

-- Simple policy: allow all operations for development
CREATE POLICY "Allow all operations for development" 
  ON public.room_jobs 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create the rooms storage bucket
DO $$
BEGIN
  -- Check if rooms bucket exists
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE name = 'rooms'
  ) THEN
    -- Create rooms bucket with proper configuration
    INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
    VALUES (
      'rooms', 
      'rooms', 
      true, 
      ARRAY['image/jpeg', 'image/png', 'image/webp'],
      10485760 -- 10MB limit
    );
  ELSE
    -- Update existing bucket to ensure it's public
    UPDATE storage.buckets 
    SET public = true,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
        file_size_limit = 10485760
    WHERE name = 'rooms';
  END IF;
END $$;

-- Also create room-images bucket (used by Edge function)
DO $$
BEGIN
  -- Check if room-images bucket exists
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE name = 'room-images'
  ) THEN
    -- Create room-images bucket with proper configuration
    INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
    VALUES (
      'room-images', 
      'room-images', 
      true, 
      ARRAY['image/jpeg', 'image/png', 'image/webp'],
      10485760 -- 10MB limit
    );
  ELSE
    -- Update existing bucket to ensure it's public
    UPDATE storage.buckets 
    SET public = true,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
        file_size_limit = 10485760
    WHERE name = 'room-images';
  END IF;
END $$;

-- Drop ALL existing storage policies that might conflict
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies on storage.objects table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        -- Drop each policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Now create our storage policies (they won't conflict since we dropped all existing ones)
CREATE POLICY "Allow public read access to room images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('rooms', 'room-images'));

CREATE POLICY "Allow uploads to room buckets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id IN ('rooms', 'room-images'));

CREATE POLICY "Allow updates to room buckets"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id IN ('rooms', 'room-images'));

CREATE POLICY "Allow deletes from room buckets"
  ON storage.objects
  FOR DELETE
  USING (bucket_id IN ('rooms', 'room-images'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_room_jobs_updated_at ON public.room_jobs;
CREATE TRIGGER update_room_jobs_updated_at
    BEFORE UPDATE ON public.room_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.room_jobs TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Success message
SELECT 'Homify database schema created successfully! ✅ All policies handled properly.' AS result; 