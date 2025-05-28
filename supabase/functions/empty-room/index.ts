import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Reference the type declarations
/// <reference path="./deno.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODES = {
  EMPTY: 'empty',    // Remove all furniture and decor
  CLEAN: 'clean'     // Keep furniture but reimagine the style (premium feature)
}

serve(async (req: Request) => {
  // Detailed request logging
  console.log("=== REQUEST RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log environment variables (redact sensitive values)
    console.log("=== ENVIRONMENT ===");
    console.log("N8N_WEBHOOK_URL configured:", !!Deno.env.get('N8N_WEBHOOK_URL'));
    console.log("Auth credentials configured:", !!Deno.env.get('N8N_WEBHOOK_AUTH_USERNAME') && !!Deno.env.get('N8N_WEBHOOK_AUTH_PASSWORD'));
    
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default when deployed
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the function
      {
        global: {
          // Don't pass Authorization header for anonymous access
          headers: { },
        },
      }
    )

    if (req.method === 'POST') {
      console.log("=== PROCESSING POST REQUEST ===");
      // Handle image upload
      const formData = await req.formData()
      // @ts-ignore - FormData.get() is available in Deno
      const file = formData.get('file') as File | null
      
      // Get the processing mode (empty or clean)
      // Cast to string and use empty mode as fallback
      // @ts-ignore - FormData.get() is available in Deno
      const modeStr = formData.get('mode') as string | null
      const mode = modeStr ? String(modeStr) : MODES.EMPTY
      
      // Get image dimensions if provided
      // @ts-ignore - FormData.get() is available in Deno
      const imageWidthStr = formData.get('imageWidth') as string | null;
      // @ts-ignore - FormData.get() is available in Deno
      const imageHeightStr = formData.get('imageHeight') as string | null;
      
      // Parse dimensions to numbers or use null if not provided
      const imageWidth = imageWidthStr ? parseInt(imageWidthStr, 10) : null;
      const imageHeight = imageHeightStr ? parseInt(imageHeightStr, 10) : null;
      
      console.log("=== FORM DATA ===");
      console.log("File received:", file ? "Yes" : "No");
      if (file) {
        console.log("File type:", file.type);
        console.log("File size:", file.size);
        console.log("File name:", file.name);
      }
      console.log("Mode:", mode);
      console.log("Image dimensions:", imageWidth && imageHeight ? `${imageWidth}x${imageHeight}` : "Not provided");
      
      // Validate mode
      if (mode !== MODES.EMPTY && mode !== MODES.CLEAN) {
        return new Response(
          JSON.stringify({ error: 'Invalid mode. Must be "empty" or "clean"' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: 'Image file is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Validate file type
      const fileType = file.type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(fileType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WebP are supported' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Generate a unique filename
      const timestamp = new Date().getTime()
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}.${fileExt}`
      const filePath = `original/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('rooms')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        console.error('Upload error details:', JSON.stringify(uploadError))
        
        // Check if the bucket exists
        const { data: buckets, error: bucketsError } = await supabaseClient
          .storage
          .listBuckets()
        
        if (bucketsError) {
          console.error('Failed to list buckets:', bucketsError)
        } else {
          console.log('Available buckets:', buckets.map(b => b.name).join(', '))
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to upload image', details: uploadError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabaseClient
        .storage
        .from('rooms')
        .getPublicUrl(filePath)

      // Create a job record in the database
      const { data: jobData, error: jobError } = await supabaseClient
        .from('room_jobs')
        .insert([
          { 
            original_path: filePath,
            status: 'processing',
            // Additional metadata can be stored here
          }
        ])
        .select()

      if (jobError) {
        console.error('Job creation error:', jobError)
        return new Response(
          JSON.stringify({ error: 'Failed to create job' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const jobId = jobData[0].id

      // Trigger n8n workflow
      const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
      if (!n8nWebhookUrl) {
        // Update job status to error if webhook URL is not configured
        await supabaseClient
          .from('room_jobs')
          .update({ status: 'error' })
          .eq('id', jobId)
        
        console.log("ERROR: N8N webhook URL not configured");
        return new Response(
          JSON.stringify({ error: 'N8N webhook URL not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Get authentication credentials
      const username = Deno.env.get('N8N_WEBHOOK_AUTH_USERNAME')
      const password = Deno.env.get('N8N_WEBHOOK_AUTH_PASSWORD')
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add Basic Authentication if credentials are provided
      if (username && password) {
        const authString = btoa(`${username}:${password}`)
        headers['Authorization'] = `Basic ${authString}`
        console.log('Added Basic Auth header for n8n webhook')
      } else {
        console.log('No authentication credentials found for n8n webhook')
      }

      // Send the image URL, job ID, and processing mode to n8n
      console.log(`Calling n8n webhook at: ${n8nWebhookUrl}`)
      const payloadObject = {
        jobId,
        imageUrl: publicUrl,
        mode,
        timestamp: Date.now(),
        imageDimensions: (imageWidth && imageHeight) ? {
          width: imageWidth,
          height: imageHeight
        } : undefined
      };
      console.log(`With payload:`, JSON.stringify(payloadObject, null, 2))

      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadObject),
        })

        console.log(`n8n response status: ${n8nResponse.status}`)
        
        if (!n8nResponse.ok) {
          const responseText = await n8nResponse.text()
          console.error('n8n webhook error:', responseText)
          console.error('n8n webhook status:', n8nResponse.status)
          
          // Update job status to error
          await supabaseClient
            .from('room_jobs')
            .update({ status: 'error' })
            .eq('id', jobId)
            
          return new Response(
            JSON.stringify({ error: 'Failed to trigger image processing', details: responseText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Log success
        console.log("Successfully called n8n webhook!");
        
        // Return the job ID to the client for polling
        return new Response(
          JSON.stringify({ 
            jobId,
            status: 'processing',
            message: `Image uploaded successfully. Processing ${mode} room transformation.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('n8n webhook error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to trigger image processing', details: String(error) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    } 
    else if (req.method === 'GET') {
      // Handle job status check
      const url = new URL(req.url)
      const jobId = url.pathname.split('/').pop()

      console.log('GET request - URL pathname:', url.pathname)
      console.log('GET request - extracted jobId:', jobId)

      if (!jobId || jobId === 'empty-room') {
        return new Response(
          JSON.stringify({ 
            error: 'Job ID is required in the URL path',
            usage: 'GET /functions/v1/empty-room/{jobId}',
            received: url.pathname
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(jobId)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid job ID format. Expected UUID.',
            received: jobId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Query the job status from the database
      const { data: jobData, error: jobError } = await supabaseClient
        .from('room_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) {
        console.error('Job query error:', jobError)
        console.error('JobId that failed:', jobId)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to get job status',
            details: jobError.message,
            jobId: jobId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      if (!jobData) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Prepare response with status
      const response: JobResponse = {
        status: jobData.status,
        createdAt: jobData.created_at,
        updatedAt: jobData.updated_at
      }

      // Add URLs if available
      if (jobData.original_path) {
        const { data: { publicUrl: originalUrl } } = supabaseClient
          .storage
          .from('rooms')
          .getPublicUrl(jobData.original_path)
        
        response.originalUrl = originalUrl
      }

      if (jobData.empty_path) {
        const { data: { publicUrl: emptyUrl } } = supabaseClient
          .storage
          .from('rooms')
          .getPublicUrl(jobData.empty_path)
        
        response.emptyUrl = emptyUrl
      }
      
      if (jobData.clean_path) {
        const { data: { publicUrl: cleanUrl } } = supabaseClient
          .storage
          .from('rooms')
          .getPublicUrl(jobData.clean_path)
        
        response.cleanUrl = cleanUrl
      }

      if (jobData.styled_path) {
        const { data: { publicUrl: styledUrl } } = supabaseClient
          .storage
          .from('rooms')
          .getPublicUrl(jobData.styled_path)
        
        response.styledUrl = styledUrl
      }

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 