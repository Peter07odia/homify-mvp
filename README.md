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
│   ├── App.tsx                      # Main app entry point
│   ├── navigation/index.tsx         # Navigation configuration
│   ├── screens/                     # Screen components
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── PhotoSelectionScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── PhotoConfirmationScreen.tsx
│   │   ├── PreviewScreen.tsx        # Main processing screen
│   │   ├── StyledRoomScreen.tsx     # Final result display
│   │   └── StyleSelectionDemo.tsx   # Style selection UI
│   ├── components/                  # Reusable components
│   │   ├── ImageComparison.tsx      # Before/after slider
│   │   ├── AnimatedPreloader.tsx    # Loading animations
│   │   └── ProcessingError.tsx      # Error handling
│   ├── services/                    # Business logic
│   │   ├── roomService.ts           # Core image processing API
│   │   └── styleService.ts          # Style management
│   ├── hooks/                       # Custom React hooks
│   │   ├── useImageProcessing.ts    # Processing state management
│   │   └── useImageActions.ts       # Image action handlers
│   ├── lib/
│   │   └── supabase.ts             # Supabase client configuration
│   └── assets/                      # Static assets and workflows
│       ├── homify_update.json       # n8n empty room workflow
│       └── homify_style_room_workflow.json # n8n style workflow
├── supabase/
│   ├── functions/
│   │   └── empty-room/              # Edge function for image processing
│   ├── migrations/                  # Database schema
│   └── config.toml                  # Supabase configuration
├── types/
│   └── env.d.ts                    # Environment variable types
├── scripts/
│   └── optimize-images.js          # Image optimization utility
└── logs/                           # Application logs (cleaned)
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

---

**Built with ❤️ using React Native, Expo, Supabase, and n8n** 