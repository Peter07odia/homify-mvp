# Homify MVP

Transform any room with AI-powered empty room visualization.

## Overview

Homify MVP is a mobile application that allows users to:

1. Take a photo of their room
2. Process it with AI to remove all furniture (Empty Room feature)
3. Visualize how the room would look empty
4. (Premium) Reimagine their room with different furniture styles (Clean feature)

## Current Status

✅ **Edge Functions**: Implemented Supabase edge function for image processing  
✅ **Storage**: Configured Supabase storage buckets for original and processed images  
✅ **Database**: Set up room_jobs table for tracking processing status  
✅ **Mobile App**: Implemented image upload, processing, and result viewing  
✅ **Processing Workflow**: Integrated with n8n and OpenAI for image transformations  
✅ **UI Enhancement**: Added fluid before/after comparison with interactive slider  
✅ **Aspect Ratio**: Images maintain their original aspect ratio through processing  
✅ **Storage Integration**: Successfully storing and retrieving images from Supabase  
🔄 **Premium Features**: Clean mode implementation in progress  

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
                         │   clean)       │
                         │                │
                         └────────────────┘
```

## Features

- **Empty Room**: Remove all furniture and decor from a room photo
- **Clean Room** (Premium): Keep furniture but reimagine the style and decor
- **Interactive Before/After Comparison**: Draggable divider with visual cues for comparing original and processed images
- **Aspect Ratio Preservation**: Maintains the original image's aspect ratio throughout processing
- **Progress Tracking**: Real-time status updates during processing
- **Save & Share**: Save processed images to camera roll or share directly

## Key Improvements

Recent improvements to the application include:

1. **Enhanced Image Comparison UI**: 
   - Replaced basic slider with intuitive draggable comparison view
   - Added visual indicators to guide user interaction
   - Implemented smooth animations for fluid transitions

2. **Image Aspect Ratio Preservation**:
   - Capturing original image dimensions during upload
   - Passing dimensions to GPT-Image-1 through n8n workflow
   - Dynamically calculating optimal dimensions while preserving aspect ratio

3. **Integration with Supabase Storage**:
   - Successfully storing and retrieving images
   - Properly handling image URLs and formats

## Implementation Details

### Edge Function

The project uses a Supabase edge function (`empty-room`) to:
- Handle image uploads from the mobile app
- Store the original image in Supabase storage
- Create a job record in the database
- Extract and pass image dimensions to maintain aspect ratio
- Trigger the n8n workflow for AI processing
- Provide a status endpoint for checking job progress

### Storage Structure

- **Original Images**: `rooms/original/{timestamp}.jpg`
- **Empty Room Results**: `rooms/empty/{jobId}.jpg`
- **Clean Results**: `rooms/clean/{jobId}.jpg`

### Database Schema

The `room_jobs` table tracks the status of each processing job:
- `id`: Unique job identifier
- `status`: Current status (processing, done, error)
- `original_path`: Path to the original image
- `empty_path`: Path to the empty room result (if available)
- `clean_path`: Path to the clean result (if available)
- `created_at`: Job creation timestamp
- `updated_at`: Last status update timestamp

## Setup

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

For implementation details about specific features, see [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)

### Quick Start

1. Configure Supabase:
   - Create project
   - Set up storage buckets (rooms/original, rooms/empty, rooms/clean)
   - Deploy edge function
   - Set up database tables

2. Configure n8n:
   - Create webhook trigger
   - Set up OpenAI connection
   - Create workflow for image processing
   - Configure dynamic image sizing
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

### Clean Room (Premium)
```
Reimagine this room with modern, stylish furniture while maintaining the same general layout. Enhance the aesthetic quality with professional interior design elements.
```

## License

MIT 