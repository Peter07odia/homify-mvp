# Homify MVP - AI-Powered Room Visualization

> Transform any room with AI-powered visualization. Upload a photo, get an empty room, then apply design styles.

[![React Native](https://img.shields.io/badge/React%20Native-0.79.2-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.9-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.38.4-green.svg)](https://supabase.com/)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## 🏗️ Architecture Overview

### Two-Stage Processing System
1. **Stage 1**: Empty Room Generation - Removes furniture and decor
2. **Stage 2**: Style Application - Applies selected design styles

### Navigation Flow
```
Splash → Onboarding → PhotoSelection → Camera/Gallery → 
PhotoConfirmation → Preview (Stage 1) → StyledRoom (Stage 2)
```

### Tech Stack

**Frontend**
- **React Native**: 0.79.2 - Cross-platform mobile framework
- **Expo**: 53.0.9 - Development platform and runtime
- **TypeScript**: 5.3.3 - Type safety and developer experience
- **React Navigation**: 6.1.9 - Navigation system

**Backend & Infrastructure**
- **Supabase**: Backend-as-a-service (database, storage, authentication)
- **n8n**: Workflow automation for image processing
- **OpenAI DALL-E 2**: AI image editing via n8n workflows
- **Deno**: Runtime for Supabase Edge Functions

**Image Processing**
- **expo-camera**: Camera functionality
- **expo-image-picker**: Gallery access
- **expo-image-manipulator**: Image manipulation
- **expo-file-system**: File operations

**UI/UX**
- **@react-native-community/slider**: Image comparison slider
- **expo-haptics**: Tactile feedback
- **react-native-safe-area-context**: Safe area handling

## 📁 Project Structure

```
homify-mvp/
├── app/
│   ├── components/
│   │   ├── AuthWrapper.tsx           # Authentication wrapper
│   │   ├── AuthPromptModal.tsx       # Authentication prompts
│   │   ├── ChatModal.tsx             # Chat interface
│   │   ├── NetworkDiagnostics.tsx    # Network debugging
│   │   ├── OptimizedImage.tsx        # Optimized image component
│   │   ├── PhotoSourceActionSheet.tsx # Photo source selection
│   │   └── StyleSelectionComponent.tsx # Style selection UI
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication context
│   ├── hooks/
│   │   ├── useImageActions.ts        # Image action hooks
│   │   └── useImageProcessing.ts     # Main processing hook
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   └── memoryHelper.ts          # Memory management
│   ├── navigation/
│   │   └── index.tsx                # Navigation configuration
│   ├── screens/
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx  # Main dashboard
│   │   │   ├── HomeScreen.tsx       # Home tab
│   │   │   ├── RoomsScreen.tsx      # Rooms management
│   │   │   ├── OrdersScreen.tsx     # Orders history
│   │   │   ├── ProfileScreen.tsx    # User profile
│   │   │   ├── RoomCreationScreen.tsx # Room creation
│   │   │   └── RoomActionSheet.tsx  # Room actions
│   │   ├── EditCanvasScreen.tsx     # Main image processing screen
│   │   ├── ProcessingStatusScreen.tsx # Processing status
│   │   ├── SplashScreen.tsx         # App splash
│   │   ├── OnboardingScreen.tsx     # User onboarding
│   │   ├── AuthScreen.tsx           # Authentication
│   │   ├── PhotoSelectionScreen.tsx # Photo selection
│   │   ├── CameraScreen.tsx         # Camera interface
│   │   ├── StyleConfirmationScreen.tsx # Style confirmation
│   │   ├── StyledRoomScreen.tsx     # Final results
│   │   └── ARRoomScanScreen.tsx     # AR room scanning
│   ├── services/
│   │   ├── roomService.ts           # Room processing service
│   │   ├── styleService.ts          # Style management
│   │   ├── pollingService.ts        # Status polling
│   │   └── arRoomScanService.ts     # AR scanning
│   ├── utils/
│   │   ├── workflowIntegration.ts   # n8n workflow integration
│   │   ├── photoStorageService.ts   # Photo storage
│   │   ├── notificationService.ts   # Notifications
│   │   ├── roomImages.ts            # Room image assets
│   │   └── permissionDebugger.ts    # Permission debugging
│   └── assets/                      # Images and static assets
├── supabase/                        # Supabase configuration
├── scripts/                         # Development scripts
└── docs/                           # Documentation
```

## 🎨 Available Design Styles

- **Minimal**: Clean, simple, uncluttered
- **Modern**: Sleek, current, innovative
- **Bohemian**: Eclectic, relaxed, colorful
- **Scandinavian**: Light, airy, functional
- **Industrial**: Raw, edgy, utilitarian
- **Botanical**: Natural, green, tranquil
- **Farmhouse**: Rustic, cozy, traditional
- **Mid-Century**: Retro, clean lines, organic

## 🔄 Processing Workflow

1. **Image Upload** → Supabase Storage (`/rooms/original/`)
2. **Job Creation** → Database record in `room_jobs` table
3. **n8n Trigger** → Webhook call to n8n workflow
4. **AI Processing** → OpenAI DALL-E 2 via n8n
5. **Result Storage** → Processed images saved to Supabase Storage
6. **Status Updates** → Database updates with result URLs

### Database Schema

```sql
room_jobs (
  id: uuid PRIMARY KEY,
  original_path: text,
  empty_path: text,
  styled_path: text,
  applied_style: text,
  status: text,
  created_at: timestamp,
  updated_at: timestamp
)
```

## ⚙️ Environment Setup

### Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhook URLs
N8N_WEBHOOK_URL=your_n8n_empty_room_webhook
STYLE_WEBHOOK_URL=your_n8n_style_webhook
```

### Supabase Setup

1. Create a new Supabase project
2. Run migrations: `npx supabase db push`
3. Create storage bucket: `rooms`
4. Set up storage folders: `original/`, `empty/`, `styled/`
5. Deploy edge functions: `npx supabase functions deploy empty-room`

### n8n Workflow Setup

1. Import `homify_update.json` for empty room processing
2. Import `homify_style_room_workflow.json` for style application
3. Configure OpenAI API credentials in n8n
4. Set webhook authentication in Supabase secrets

## 🧪 Development Scripts

```bash
npm start           # Start Expo development server
npm run reset       # Clear cache and restart
npm run clean       # Clear Metro cache
npm run prod        # Run in production mode
npm run fix-deps    # Fix dependency issues
```

## 🚢 Deployment

### Supabase Production

```bash
# Link to production project
npx supabase link --project-ref your-project-ref

# Deploy edge functions
npx supabase functions deploy empty-room

# Set production secrets
npx supabase secrets set N8N_WEBHOOK_URL=your_production_webhook
npx supabase secrets set N8N_WEBHOOK_AUTH_USERNAME=your_username
npx supabase secrets set N8N_WEBHOOK_AUTH_PASSWORD=your_password
```

### Expo/EAS Build

```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit
```

## 🐛 Troubleshooting

### Common Issues

**Image Processing Fails**
- Check n8n webhook authentication
- Verify Supabase storage permissions
- Check OpenAI API credits

**App Crashes on Startup**
- Clear Expo cache: `npm run reset`
- Check environment variables
- Verify all dependencies: `npm run fix-deps`

**Navigation Issues**
- Check React Navigation version compatibility
- Verify screen component exports

### Debug Commands

```bash
# Clear all caches
npm run clear-cache

# Check dependencies
npm run fix-deps

# View detailed logs
npx expo start --clear
```

## 📱 Features

- ✅ Camera and gallery photo capture
- ✅ Real-time image processing with AI
- ✅ Interactive before/after comparison slider
- ✅ 8 distinct design style options
- ✅ Two-stage processing (empty → styled)
- ✅ Haptic feedback and smooth animations
- ✅ Error handling and retry mechanisms
- ✅ Responsive UI for all screen sizes

## 🔗 API Reference

### Room Processing API

```typescript
// Upload image for processing
uploadRoomImage(imageUri: string, mode: 'empty' | 'clean'): Promise<string>

// Check processing status
checkJobStatus(jobId: string): Promise<RoomJobStatus>

// Apply style to empty room
applyStyleToRoom(jobId: string, styleId: DesignStyle): Promise<void>
```

### Style Management API

```typescript
// Available styles
DESIGN_STYLES: DesignStyle[]

// Set user preference
setUserPreferredStyle(styleId: DesignStyle): void

// Get style-specific loading messages
getStyleSpecificLoadingMessages(styleId: DesignStyle, mode: ProcessingMode): string[]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Recent Fixes

### 🚨 **CRITICAL NETWORK FIX** - Network Request Failures RESOLVED
**Issue**: "TypeError: Network request failed" when calling Edge Function

**Root Causes FIXED:**
1. **FormData Field Name Mismatch**: 
   - ❌ App was sending: `formData.append('image', ...)`
   - ✅ Edge Function expects: `formData.get('file')`
   - **FIXED**: Changed to `formData.append('file', ...)`

2. **Content-Type Header Conflict**:
   - ❌ Manually setting: `'Content-Type': 'multipart/form-data'`
   - ✅ Let browser set boundary automatically
   - **FIXED**: Removed manual Content-Type header

**Result**: Edge Function calls now work correctly, no more network failures!

### Auto-Triggering Prevention (Credit Protection) - CRITICAL UPDATE
To prevent auto-triggering of workflows and unnecessary credit consumption:

#### ✅ **Root Causes FIXED:**
1. **PreviewScreen REMOVED** - Consolidated functionality into EditCanvasScreen
2. **EditCanvasScreen duplicate calls ELIMINATED** - Removed duplicate edge function calls
3. **App initialization polling DISABLED** - No auto-polling on app startup
4. **Edge function connectivity tests DISABLED** - No automatic GET requests
5. **Circuit breaker IMPLEMENTED** - Stops polling failed jobs after 3 attempts
6. **Polling frequency REDUCED** - Changed from 5 seconds to 10 seconds to save API calls
7. **Duplicate job detection ADDED** - Edge Function prevents processing same image twice within 10 minutes

#### 🚨 **Previously Found Issues:**
- **PreviewScreen** was auto-calling `processingActions.startProcessing()` on mount (NOW REMOVED)
- **EditCanvasScreen** had DUPLICATE calls: both `processingActions.startProcessing()` AND `WorkflowIntegration.startRoomCreation()`
- Each button press was triggering the edge function **TWICE**
- App startup was auto-initializing polling and making connectivity tests

#### ✅ **Manual Control Now Required:**
- Users must manually tap "Start Processing" button in EditCanvasScreen
- No automatic workflow triggers on app startup, screen navigation, or background processes
- Complete protection from accidental credit consumption

**Current Workflow:**
1. User selects photo (Camera/Gallery)
2. User navigates to EditCanvasScreen
3. User manually taps "Start Processing" to begin empty room creation
4. User selects style and applies it manually
5. Processing completes and shows final result

If you need to check for existing processing jobs, you can:
1. Go to Dashboard (My Photos) screen
2. Tap the "Test Workflow" button (if in debug mode)
3. Select "Check Existing Jobs"

This ensures workflows are only triggered when users explicitly start processing, protecting your credits from auto-consumption.

## ⚙️ Features

---

**Built with ❤️ using React Native, Expo, Supabase, and n8n** 