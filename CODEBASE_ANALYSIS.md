# Homify Codebase Analysis

This document provides a thorough analysis of the Homify app codebase, explaining how different components work together.

## Application Overview

Homify is a React Native application that allows users to take photos of rooms, process them with AI to remove furniture, and visualize the empty room. The app uses a combination of frontend mobile components and backend services (Supabase and n8n) to achieve this functionality.

## Core Components

### 1. Entry Point and Navigation

- **index.js**: The entry point that registers the main App component.
- **app/App.tsx**: Sets up the SafeAreaProvider and StatusBar, and renders the Navigation component.
- **app/navigation/index.tsx**: Configures React Navigation with the following screens:
  - SplashScreen (initial)
  - OnboardingScreen
  - CameraScreen
  - PhotoConfirmationScreen
  - RoomStyleOptionsScreen
  - PreviewScreen

The navigation flow follows a logical sequence from onboarding to camera capture to processing and preview.

### 2. Key Screens

- **SplashScreen**: Initial loading screen, likely contains branding and initialization logic.
- **OnboardingScreen**: Introduces users to the app functionality (for first-time users).
- **CameraScreen**: Uses Expo Camera to capture room photos.
- **PhotoConfirmationScreen**: Allows users to confirm or retake the photo.
- **RoomStyleOptionsScreen**: Lets users select processing options (empty vs. clean).
- **PreviewScreen**: The most complex screen, handling:
  - Image upload and processing
  - Status polling
  - Before/after comparison with interactive slider
  - Error handling and retry
  - Saving and sharing results

### 3. Backend Services

- **app/lib/supabase.ts**: Configures the Supabase client and exports the edge function URL.
- **app/services/roomService.ts**: Contains the core service functions:
  - `uploadRoomImage`: Uploads room image to Supabase edge function
  - `checkJobStatus`: Checks processing status
  - `pollJobStatus`: Continuously polls until processing completes
  - `testWebhookConnection`: Tests connectivity to the n8n webhook

### 4. Environment Configuration

- **.env**: Contains environment variables:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - N8N_WEBHOOK_URL
- **babel.config.js**: Configures Babel with the react-native-dotenv plugin.
- **types/env.d.ts**: TypeScript declarations for environment variables.

### 5. Memory Management

- **app/lib/memoryHelper.ts**: Contains utilities for memory optimization:
  - Image cache clearing
  - iOS-specific memory cleanup
  - Debugging utilities for image processing

### 6. Supabase Backend

Based on the setup guide and implementation notes:

1. **Edge Function** (`supabase/functions/empty-room`):
   - Receives image uploads
   - Stores original images
   - Creates job records
   - Triggers n8n workflow

2. **Storage Buckets**:
   - `rooms/original`: Stores uploaded images
   - `rooms/empty`: Stores processed empty room images
   - `rooms/clean`: Stores processed clean room images (premium feature)

3. **Database**:
   - `room_jobs` table: Tracks processing status and image paths

### 7. n8n Workflow

The n8n workflow (configured externally):
1. Receives webhook trigger from Supabase
2. Downloads the original image
3. Sends to OpenAI GPT-Image-1 for processing
4. Downloads the result
5. Uploads result to Supabase storage
6. Updates job status in database

## Key Data Flows

### Room Processing Flow

1. User takes photo (CameraScreen)
2. User confirms photo (PhotoConfirmationScreen)
3. User selects processing options (RoomStyleOptionsScreen)
4. App uploads image to Supabase edge function (PreviewScreen)
5. Edge function stores image and triggers n8n
6. n8n processes image with OpenAI
7. n8n stores result and updates status
8. App polls for completion
9. App displays before/after comparison
10. User can save or share result

### Error Handling

The application has robust error handling:
- Connection testing before uploading
- Timeout handling for long-running processes
- Status polling with retry logic
- Recovery from app background/foreground transitions
- User-friendly error messages with retry options

## Performance Optimizations

1. **Memory Management**:
   - Image cache clearing to prevent memory leaks
   - Platform-specific optimizations for iOS
   - Unmounting screens when not focused

2. **UI Performance**:
   - Native animations for slider
   - Haptic feedback for better user experience
   - Efficient image loading and display

3. **Network Efficiency**:
   - Status polling with increasing intervals
   - Connection testing before heavyweight operations

## Code Organization Patterns

The codebase follows several best practices:
- Separation of concerns (screens, services, navigation)
- TypeScript for type safety
- React hooks for state management
- Async/await for asynchronous operations
- Clean component unmounting to prevent memory leaks
- Platform-specific optimizations

## Integration Points

1. **Supabase Integration**:
   - Client setup in supabase.ts
   - Edge function URL for API calls
   - Storage access for images

2. **Expo Integration**:
   - Camera for photo capture
   - FileSystem for file handling
   - MediaLibrary for saving images
   - ImageManipulator for image processing
   - Haptics for tactile feedback

3. **OpenAI Integration** (via n8n):
   - GPT-Image-1 for room processing
   - Prompt engineering for different modes (empty vs. clean)

## Potential Improvement Areas

Based on the code review, potential areas for improvement might include:

1. **State Management**: Consider using a state management library for complex screens.
2. **Testing**: Add automated tests for critical functionality.
3. **Error Reporting**: Implement comprehensive error reporting.
4. **Performance Monitoring**: Add analytics for performance tracking.
5. **Offline Support**: Implement queue for offline image uploads.

This analysis provides a high-level overview of how the different components of the Homify app work together to deliver the room visualization functionality. 