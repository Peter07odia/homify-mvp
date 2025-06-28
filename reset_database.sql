-- ============================================================
-- HOMIFY DATABASE RESET SCRIPT
-- ============================================================
-- Run this in your Supabase SQL Editor to completely reset
-- your database to a clean state, then apply the migration
-- ============================================================

-- Step 1: Drop all existing tables and functions (clean slate)
DROP TABLE IF EXISTS public.room_jobs CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_room_jobs_updated_at() CASCADE;

-- Step 2: Clean up storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('rooms', 'room-images');
DELETE FROM storage.buckets WHERE name IN ('rooms', 'room-images');

-- Step 3: Success message
SELECT 'Database reset complete! Now run the migration file.' AS result;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Run this script first to clean everything
-- 2. Then run supabase/migrations/20240701000001_init_schema.sql
-- 3. Your database will be in a clean, working state
-- ============================================================ 