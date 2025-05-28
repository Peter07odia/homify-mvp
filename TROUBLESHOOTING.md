# Homify App Troubleshooting Guide

This guide provides solutions for common issues you might encounter when running the Homify app.

## Metro Bundler Issues

### Cannot find module 'metro/src/ModuleGraph/worker/importLocationsPlugin'

This error occurs due to version incompatibility between Metro bundler and Expo SDK.

**Solution:**
1. Update Metro versions in package.json:
   ```json
   "metro": "0.76.8",
   "metro-resolver": "0.76.8",
   ```

2. Update metro.config.js to include proper resolver configuration:
   ```javascript
   // Learn more https://docs.expo.io/guides/customizing-metro
   const { getDefaultConfig } = require('expo/metro-config');
   const path = require('path');

   /** @type {import('expo/metro-config').MetroConfig} */
   const config = getDefaultConfig(__dirname);

   // Ensure we use the compatible resolver
   config.resolver = {
     ...config.resolver,
     sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
     resolverMainFields: ['react-native', 'browser', 'main'],
   };

   // Ensure proper handling of symlinks
   config.watchFolders = [path.resolve(__dirname, './')];

   module.exports = config;
   ```

3. Clean Metro cache and reinstall dependencies:
   ```bash
   rm -rf node_modules
   rm -rf /tmp/metro-*
   npm install
   ```

4. Start the app in production mode if development mode fails:
   ```bash
   npm run prod
   ```

## Environment Variables Issues

### Cannot find module '@env' or Cannot access environment variables

This error occurs when the TypeScript compiler can't find type definitions for the @env module.

**Solution:**
1. Create a types/env.d.ts file with the following content:
   ```typescript
   declare module '@env' {
     export const SUPABASE_URL: string;
     export const SUPABASE_ANON_KEY: string;
     export const N8N_WEBHOOK_URL: string;
   }
   ```

2. Update babel.config.js to handle environment variables properly:
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['module:react-native-dotenv', {
           moduleName: '@env',
           path: '.env',
           blacklist: null,
           whitelist: null,
           safe: true,
           allowUndefined: false
         }]
       ]
     };
   };
   ```

3. Make sure your .env file exists and has the required variables:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   N8N_WEBHOOK_URL=your-webhook-url
   ```

## Dependency Version Mismatches

### Incompatible React and React Native versions

This happens when there are mismatches between React, React Native, and Expo SDK versions.

**Solution:**
1. For Expo SDK 53, use these compatible versions:
   ```json
   "react": "18.2.0",
   "react-native": "0.73.4",
   "expo-camera": "~13.6.0",
   "expo-file-system": "~16.0.5",
   "expo-haptics": "~12.8.1",
   "expo-image-manipulator": "~11.8.0",
   "expo-image-picker": "~14.7.1",
   "expo-media-library": "~15.9.0",
   "expo-status-bar": "~1.11.1"
   ```

2. To check for compatible versions, run:
   ```bash
   npm run fix-deps
   ```

## Useful NPM Scripts

We've added several useful scripts to help debug and fix issues:

- `npm run prod`: Start the app in production mode (--no-dev)
- `npm run fix-deps`: Check and fix dependency versions to match Expo SDK
- `npm run clear-cache`: Clear Metro and Node.js caches
- `npm run reset`: Clean and restart the app with a cleared cache

## When All Else Fails

If you're still experiencing issues:

1. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Reset Expo's cache completely:
   ```bash
   npx expo-doctor
   npx expo install --check
   npx expo start -c
   ```

3. Check for Expo SDK compatibility using the [Expo SDK compatibility table](https://docs.expo.dev/versions/latest/sdk/overview/)

4. Run the app with the `--no-dev` flag which disables development features and may avoid certain errors:
   ```bash
   npm run prod
   ``` 