-- Table to track room transformation jobs
CREATE TABLE IF NOT EXISTS public.room_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- for future user association
  original_path TEXT, -- path to original image in storage
  empty_path TEXT, -- path to empty room image in storage
  clean_path TEXT, -- path to clean room image in storage (for premium feature)
  status TEXT DEFAULT 'processing', -- processing, done, error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.room_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for now" ON public.room_jobs;

-- For now, allow all operations (will be restricted in production)
CREATE POLICY "Allow all operations for now" 
  ON public.room_jobs 
  FOR ALL 
  USING (true);

-- Create buckets for room images if they don't exist
-- Will store original, empty, and upstyle images
DO $$
BEGIN
  -- Check if rooms bucket exists
  IF NOT EXISTS (
    SELECT FROM storage.buckets WHERE name = 'rooms'
  ) THEN
    -- Create rooms bucket with proper configuration
    INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
    VALUES (
      'rooms', 
      'rooms', 
      true, 
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
    
    -- Create virtual folders by uploading placeholder files
    -- These will be automatically deleted by the trigger below
    INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
    VALUES 
      ('rooms', 'original/.placeholder', NULL, '{}'::jsonb, now()),
      ('rooms', 'empty/.placeholder', NULL, '{}'::jsonb, now()),
      ('rooms', 'clean/.placeholder', NULL, '{}'::jsonb, now()),
      ('rooms', 'styled/.placeholder', NULL, '{}'::jsonb, now());
  END IF;
END $$;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to rooms bucket" ON storage.objects;

-- Create policy to allow public read access to room images
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rooms');

-- Create policy to allow uploads to rooms bucket (regardless of auth status for now)
CREATE POLICY "Allow uploads to rooms bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'rooms');

-- Also allow updates and deletes for development
CREATE POLICY "Allow object management"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'rooms');