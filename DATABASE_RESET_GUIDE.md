# Homify Database Reset Guide

## The Problem
You had 6+ SQL migration files that were conflicting and causing issues. This guide will help you get back to a clean, working state with just ONE migration file.

## The Solution
We've cleaned everything up to just 2 files:
1. `reset_database.sql` - Cleans up your database
2. `supabase/migrations/20240701000001_init_schema.sql` - The ONLY migration you need

## Steps to Reset

### 1. Reset Your Database
1. Go to your Supabase Dashboard
2. Open the SQL Editor
3. Copy and paste the content of `reset_database.sql`
4. Run it
5. You should see: "Database reset complete! Now run the migration file."

### 2. Apply the Clean Migration
1. Still in the SQL Editor
2. Copy and paste the content of `supabase/migrations/20240701000001_init_schema.sql`
3. Run it
4. You should see: "Homify database schema created successfully! ✅"

### 3. Test Your App
1. Your Edge function should now work properly
2. It will create jobs with all the required fields:
   - `room_type`
   - `applied_style`
   - `quality_level`
   - `custom_prompt`

## What's Fixed
- ✅ Single, clean migration file
- ✅ All required fields for your Edge function
- ✅ Proper storage buckets (`rooms` and `room-images`)
- ✅ Correct RLS policies
- ✅ Fixed bucket inconsistency in Edge function

## If You Have Issues
1. Make sure you run the reset script FIRST
2. Then run the migration
3. Check that both storage buckets exist in your Supabase Storage tab
4. Test your app - it should work now!

You're back to having just ONE working migration file like you originally had! 🎉 