# Homify MVP Setup Guide

This guide walks you through setting up the Supabase backend and n8n workflow for the Homify MVP empty room feature.

## 1. Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in
2. Create a new project with a name like "Homify MVP"
3. Choose a strong database password and save it securely
4. Select a region closest to your target users for lower latency

### 1.2 Configure Environment Variables

1. In your Supabase project, go to Project Settings > API
2. Copy the "Project URL" and "anon/public" key
3. Update your `.env` file with these values:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 1.3 Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/20240701000001_init_schema.sql`
4. Run the query to create the necessary tables and policies

### 1.4 Create Storage Buckets

The SQL migration should have created the storage buckets, but verify:

1. Go to Storage in your Supabase dashboard
2. You should see a bucket named "rooms"
3. Create the following folders inside the "rooms" bucket:
   - `original` (for uploaded room images)
   - `empty` (for generated empty room images)
   - `upstyle` (for upstyle room transformations - premium feature)

### 1.5 Deploy the Edge Function

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Log in to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy empty-room --no-verify-jwt
   ```

5. Test that the function is working by visiting:
   ```
   https://your-project-id.supabase.co/functions/v1/empty-room
   ```
   You should get a "Method not allowed" response.

## 2. n8n Setup

### 2.1 Create an n8n Account

1. Go to [n8n.io](https://n8n.io/) and sign up for an account
2. Create a new workflow

### 2.2 Set Up the Webhook Trigger Node

1. Add a new node, select "Webhook"
2. Configure the webhook:
   - Authentication: None (for simplicity, add later for production)
   - HTTP Method: POST
   - Path: `/empty-room` (or any name you prefer)
   - Response Mode: Last Node

3. Copy the webhook URL and update your `.env` file:
   ```
   N8N_WEBHOOK_URL=https://your-n8n-instance.cloud/webhook/empty-room
   ```

### 2.3 Create the Image Processing Workflow

Add the following nodes to your workflow:

#### 1. Webhook Trigger
- Configured as described above

#### 2. HTTP Request Node (Download Original Image)
- Operation: GET
- URL: `={{$json.imageUrl}}`
- Response Format: File
- Output Binary Data: Yes

#### 3. OpenAI Node (Process Image)
- API Key: Your OpenAI API key
- Resource: Image
- Operation: Edit Image
- Image: `={{$binary.data.data}}`
- Mask: Leave empty (GPT-Image-1 can detect what to remove)
- For `empty` mode:
  - Prompt: "Remove all movable furniture and decor from this room. Keep walls, floor, windows, doors, and built-in fixtures unchanged. Make it completely empty."
- For `upstyle` mode (conditional branch):
  - Prompt: "Reimagine this room with modern, stylish furniture. Keep the same general layout but improve the style and aesthetic quality. Make it look like a professional interior design."
- Size: 1024x1024
- Response Format: URL

#### 4. Branch Node (for Empty vs Upstyle)
- Add a branch node after the HTTP Request node
- Condition: `={{$json.mode === "empty"}}`
- For empty path: Use prompt for empty room
- For upstyle path: Use prompt for upstyle

#### 5. HTTP Request Node (Download Result)
- Operation: GET
- URL: `={{$json.url}}` (from OpenAI response)
- Response Format: File
- Output Binary Data: Yes

#### 6. Supabase Node (Upload Result)
- API Credentials: Your Supabase project credentials
- Resource: Storage
- Operation: Upload
- Bucket: rooms
- For empty mode:
  - File Path: `empty/{{$json.jobId}}.jpg`
- For upstyle mode:
  - File Path: `upstyle/{{$json.jobId}}.jpg`
- Binary Property: `data` (from downloaded result)

#### 7. Supabase Node (Update Job Status)
- API Credentials: Your Supabase project credentials
- Resource: Database
- Operation: Update
- Table: room_jobs
- Update Key: id
- Update Value: `={{$json.jobId}}`
- Fields to Update:
  - For empty mode:
    - status: done
    - empty_path: `empty/{{$json.jobId}}.jpg`
  - For upstyle mode:
    - status: done
    - upstyle_path: `upstyle/{{$json.jobId}}.jpg`

#### 8. Error Handling
Add error handling nodes after OpenAI and other critical steps:

1. Error Trigger Node
   - Run When: On Error
   - Trigger Node: The node that might fail

2. Supabase Node (Update Job Status to Error)
   - Resource: Database
   - Operation: Update
   - Table: room_jobs
   - Update Key: id
   - Update Value: `={{$workflow.input.item.json.jobId}}`
   - Fields to Update:
     - status: error

### 2.4 Save and Activate the Workflow

1. Click "Save" to save your workflow
2. Toggle the "Active" switch to make your workflow live

## 3. Testing End-to-End

1. Deploy your mobile app with the updated environment variables
2. Take a photo of a room on your device
3. Submit it for processing
4. You should get a job ID immediately
5. Poll the status until processing is complete
6. View the before/after images with the slider

## 4. Optimizing the Prompt

For best results with the empty room feature, consider these best practices for your OpenAI GPT-Image-1 prompt:

### Empty Room Prompt Best Practices:

```
Remove all movable furniture and decor from this room. Keep walls, floor, windows, doors, and built-in fixtures unchanged. Maintain the same lighting, shadows, and perspective. Fill in the areas where furniture was with appropriate flooring or wall textures that match the room. Keep all architectural elements intact.
```

### Upstyle Room Prompt Best Practices (Premium Feature):

```
Reimagine this room with modern, stylish furniture while maintaining the same general layout. Enhance the aesthetic quality with professional interior design elements. Keep the basic architectural structure but upgrade the furniture, decor, color scheme, and lighting to create a cohesive, high-end look.
```

## 5. Troubleshooting

### Supabase Issues
- Check bucket permissions and RLS policies
- Verify file formats and MIME types
- Monitor edge function logs in Supabase dashboard

### n8n Issues
- Check webhook execution logs
- Test each node individually
- Verify API credentials and environment variables

### OpenAI Issues
- Monitor API usage and rate limits
- Check for prompt effectiveness
- Adjust image resolution based on performance needs 