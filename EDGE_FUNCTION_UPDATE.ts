// =================================================================
// HOMIFY UNIFIED PROCESSING - EDGE FUNCTION
// =================================================================
// This Edge Function connects your Supabase backend to the n8n 
// workflow for processing room images with AI.
// =================================================================

import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Webhook URL for your unified n8n workflow
const N8N_UNIFIED_WEBHOOK = 'https://jabaranks7.app.n8n.cloud/webhook/process-room-unified'

// Function to log with timestamp
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '')
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    log('Process room function called')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      log('Authentication error', userError)
      throw new Error(`Authentication failed: ${userError.message}`)
    }
    
    if (!user) {
      log('No authenticated user found')
      throw new Error('No user found. Please sign in.')
    }

    log('User authenticated', { userId: user.id })

    // Parse request body
    const requestData = await req.json()
    
    // Extract parameters with default values
    const { 
      jobId, 
      imageUrl, 
      roomType = 'living_room', 
      selectedStyle = 'modern', 
      quality = 'standard', 
      customPrompt = '' 
    } = requestData

    // Validate required fields
    if (!jobId || !imageUrl) {
      log('Missing required fields', { jobId, imageUrl })
      throw new Error('Missing required fields: jobId and imageUrl are required')
    }

    log('Processing request', { 
      jobId, 
      roomType, 
      selectedStyle, 
      quality,
      hasCustomPrompt: !!customPrompt
    })
    
    // Update database to show processing has started
    const { error: updateError } = await supabaseClient
      .from('room_jobs')
      .update({ 
        status: 'processing',
        room_type: roomType,
        applied_style: selectedStyle,
        quality_level: quality,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    if (updateError) {
      log('Database update error', updateError)
      // Continue anyway - not critical
    }
    
    // Prepare payload for n8n
    const payload = {
      jobId,
      imageUrl,
      userId: user.id,
      roomType,
      selectedStyle,
      quality,
      customPrompt,
      timestamp: new Date().toISOString()
    }
    
    log('Calling n8n webhook', { url: N8N_UNIFIED_WEBHOOK })
    
    // Call the n8n webhook
    const n8nResponse = await fetch(N8N_UNIFIED_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    // Handle n8n response
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      log('n8n webhook error', { status: n8nResponse.status, error: errorText })
      throw new Error(`n8n processing failed (${n8nResponse.status}): ${errorText}`)
    }

    // Parse successful response
    const result = await n8nResponse.json()
    log('n8n processing successful', { jobId, resultStatus: result.status })

    // Return success response
    return new Response(
      JSON.stringify({
        ...result,
        processingStarted: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    // Log and return any errors
    log('Edge function error', { message: error.message, stack: error.stack })
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        processingStarted: false
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
}) 