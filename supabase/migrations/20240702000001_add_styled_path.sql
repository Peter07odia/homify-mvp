-- Add styled_path field to room_jobs table for storing styled image paths
ALTER TABLE public.room_jobs 
ADD COLUMN IF NOT EXISTS styled_path TEXT;

-- Create styled folder in storage if it doesn't exist
INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at)
VALUES ('rooms', 'styled/.placeholder', NULL, '{}'::jsonb, now())
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Update the updated_at timestamp when styled_path is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_room_jobs_updated_at ON public.room_jobs;
CREATE TRIGGER update_room_jobs_updated_at
    BEFORE UPDATE ON public.room_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 