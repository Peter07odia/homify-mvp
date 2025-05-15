-- Table to track room transformation jobs
CREATE TABLE public.room_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- for future user association
  original_path TEXT, -- path to original image in storage
  empty_path TEXT, -- path to empty room image in storage
  upstyle_path TEXT, -- path to upstyle image in storage (for premium feature)
  status TEXT DEFAULT 'processing', -- processing, done, error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.room_jobs ENABLE ROW LEVEL SECURITY;

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
    INSERT INTO storage.buckets (id, name, public, cors_origins, allowed_mime_types)
    VALUES (
      'rooms', 
      'rooms', 
      true, 
      ARRAY['*'], -- Allow all origins for development, restrict in production
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
END $$;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create policy to allow public read access to room images
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rooms');

-- Create policy to allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'rooms');