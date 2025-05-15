# Homify MVP

Transform any room with AI-powered empty room visualization.

## Overview

Homify MVP is a mobile application that allows users to:

1. Take a photo of their room
2. Process it with AI to remove all furniture (Empty Room feature)
3. Visualize how the room would look empty
4. (Premium) Reimagine their room with different furniture styles (Upstyle feature)

## Architecture

```
┌─────────────┐           ┌───────────────┐          ┌─────────────┐          ┌───────────────┐
│             │           │               │          │             │          │               │
│  Mobile App │ ───POST──►│ Supabase Edge │ ──POST──►│ n8n Workflow│ ──POST──►│  OpenAI       │
│  (Expo)     │           │  Function     │          │             │          │  GPT-Image-1  │
│             │           │               │          │             │          │               │
└─────────────┘           └───────────────┘          └─────────────┘          └───────────────┘
       ▲                          │                         │                         │
       │                          │                         │                         │
       │                          ▼                         │                         ▼
       │                 ┌────────────────┐                 │                ┌────────────────┐
       │                 │                │                 │                │                │
       │                 │  Supabase      │                 │                │  Processed     │
       │                 │  Storage       │◄────────────────┘                │  Images        │
       │                 │  (original)    │                                  │                │
       │                 │                │                                  │                │
       │                 └────────────────┘                                  └────────────────┘
       │                          │                                                  │
       │                          │                                                  │
       │                          ▼                                                  │
       │                 ┌────────────────┐                                          │
       │                 │                │                                          │
       │                 │  Supabase      │◄─────────────────────────────────────────┘
       │                 │  Storage       │
       └─────────────────│  (empty/       │
                         │   upstyle)     │
                         │                │
                         └────────────────┘
```

## Features

- **Empty Room**: Remove all furniture and decor from a room photo
- **Upstyle Room** (Premium): Keep furniture but reimagine the style and decor
- **Before/After Slider**: Compare original and processed images
- **Progress Tracking**: Real-time status updates during processing

## Setup

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Quick Start

1. Configure Supabase:
   - Create project
   - Set up storage buckets (rooms/original, rooms/empty, rooms/upstyle)
   - Deploy edge function
   - Set up database tables

2. Configure n8n:
   - Create webhook trigger
   - Set up OpenAI connection
   - Create workflow for image processing
   - Set up error handling

3. Configure Mobile App:
   - Update .env with Supabase and n8n credentials
   - Test image upload and processing
   - Implement UI for viewing results

## Environment Variables

```
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# n8n Webhook
N8N_WEBHOOK_URL=https://your-n8n-instance.cloud/webhook/empty-room
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Prompts for AI Image Processing

### Empty Room
```
Remove all movable furniture and decor from this room. Keep walls, floor, windows, doors, and built-in fixtures unchanged. Maintain the same lighting, shadows, and perspective.
```

### Upstyle Room (Premium)
```
Reimagine this room with modern, stylish furniture while maintaining the same general layout. Enhance the aesthetic quality with professional interior design elements.
```

## License

MIT 