# Homify - Cleanup Candidates

This document lists files and directories that may be unnecessary for the functioning application. **Do not delete any of these without careful consideration**.

## Potentially Unnecessary Files

### Temporary and System Files

1. **prev_version.txt**
   - This appears to be a backup of older code (PreviewScreen.tsx)
   - It could be used for reference but is not required for the app to function
   - Consider archiving this file elsewhere or in source control

2. **.DS_Store files**
   - These are macOS system files that store folder view preferences
   - They don't affect functionality and are automatically recreated by macOS
   - Can be safely removed but will be recreated if you use macOS

3. **Temporary Supabase Files**
   - Files in `supabase/.temp/` are likely temporary files used by Supabase CLI
   - These are usually safe to remove but will be recreated when using Supabase CLI

4. **Log Files**
   - Old log files in the `logs/` directory that aren't needed for debugging
   - Consider keeping recent logs and removing older ones

### Potentially Redundant Documentation

1. **Duplicate Documentation**
   - If you find that some information is duplicated across multiple files
   - Consider consolidating into a single, well-organized document

### Build Artifacts

1. **Expo Build Artifacts**
   - Any build artifacts in `.expo/` that aren't needed
   - These are recreated during the build process

## Important: Do Not Remove

The following files/directories are critical and should NOT be removed:

1. **All app/ directory files**
   - Contains all application code

2. **Supabase Configuration**
   - `supabase/functions/` - Contains edge functions
   - `supabase/migrations/` - Contains database schema

3. **Configuration Files**
   - `.env` - Environment variables
   - `babel.config.js` - Babel configuration
   - `metro.config.js` - Metro bundler configuration
   - `app.json` - Expo configuration
   - `tsconfig.json` - TypeScript configuration
   - `package.json` and `package-lock.json` - Dependencies

4. **Documentation**
   - `SETUP_GUIDE.md`
   - `IMPLEMENTATION_NOTES.md`
   - `TROUBLESHOOTING.md`

## Recommended Approach

1. Before deleting any file, make a backup of your entire project
2. Consider using version control (if not already) to track changes
3. Test the application thoroughly after removing any file
4. Remove files one at a time and test between removals 