import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODES = {
  EMPTY: 'empty',    // Remove all furniture and decor
  UPSTYLE: 'upstyle' // Keep furniture but reimagine the style (premium feature)
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default when deployed
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the function
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    if (req.method === 'POST') {
      // Handle image upload
      const formData = await req.formData()
      const file = formData.get('file')
      
      // Get the processing mode (empty or upstyle)
      const mode = formData.get('mode') as string || MODES.EMPTY
      
      // Validate mode
      if (mode !== MODES.EMPTY && mode !== MODES.UPSTYLE) {
        return new Response(
          JSON.stringify({ error: 'Invalid mode. Must be "empty" or "upstyle"' }),
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
        return new Response(
          JSON.stringify({ error: 'Failed to upload image' }),
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
          
        return new Response(
          JSON.stringify({ error: 'N8N webhook URL not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Send the image URL, job ID, and processing mode to n8n
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          imageUrl: publicUrl,
          mode,  // Pass the mode to n8n
          timestamp: Date.now(),
        }),
      })

      if (!n8nResponse.ok) {
        console.error('n8n webhook error:', await n8nResponse.text())
        
        // Update job status to error
        await supabaseClient
          .from('room_jobs')
          .update({ status: 'error' })
          .eq('id', jobId)
          
        return new Response(
          JSON.stringify({ error: 'Failed to trigger image processing' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Return the job ID to the client for polling
      return new Response(
        JSON.stringify({ 
          jobId,
          status: 'processing',
          message: `Image uploaded successfully. Processing ${mode} room transformation.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } 
    else if (req.method === 'GET') {
      // Handle job status check
      const url = new URL(req.url)
      const jobId = url.pathname.split('/').pop()

      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'Job ID is required' }),
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
        return new Response(
          JSON.stringify({ error: 'Failed to get job status' }),
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
      const response = {
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
      
      if (jobData.upstyle_path) {
        const { data: { publicUrl: upstyleUrl } } = supabaseClient
          .storage
          .from('rooms')
          .getPublicUrl(jobData.upstyle_path)
        
        response.upstyleUrl = upstyleUrl
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