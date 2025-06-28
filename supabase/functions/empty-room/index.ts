import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Reference the type declarations
/// <reference path="./deno.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROCESSING_MODES = {
  EMPTY: 'empty',
  UNIFIED: 'unified'  // New unified mode for both empty + style
}

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const roomType = formData.get('roomType') as string || 'living-room'
    const selectedStyle = formData.get('selectedStyle') as string || 'contemporary'
    const customPrompt = formData.get('customPrompt') as string || ''
    const quality = formData.get('quality') as string || 'standard'
    const userId = formData.get('userId') as string || null
    const mode = formData.get('mode') as string || 'simple' // 'simple' or 'complex'
    
    if (!file) {
      throw new Error('No file uploaded')
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID()
    
    console.log(`📸 Processing ${mode} transformation for job ${jobId}`)

    // Upload original image to Supabase storage
    const fileName = `${jobId}.jpg`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('room-images')
      .upload(`original/${fileName}`, file, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabaseClient.storage
      .from('room-images')
      .getPublicUrl(`original/${fileName}`)

    console.log(`✅ Image uploaded successfully: ${publicUrl}`)

    // Create job record in database
    const { data: jobData, error: jobError } = await supabaseClient
      .from('room_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        status: 'processing',
        room_type: roomType,
        applied_style: selectedStyle,
        quality_level: quality,
        original_path: publicUrl,
        processing_mode: mode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('❌ Job creation error:', jobError)
      throw jobError
    }

    console.log(`✅ Job record created: ${jobId}`)

    // Determine which workflow to use
    const webhookUrl = mode === 'simple' 
      ? Deno.env.get('N8N_SIMPLE_WEBHOOK_URL') || 'https://jabaranks7.app.n8n.cloud/webhook/transform-room-simple'
      : Deno.env.get('N8N_UNIFIED_WEBHOOK_URL') || 'https://jabaranks7.app.n8n.cloud/webhook/process-room-unified'

    console.log(`🎯 Triggering ${mode} workflow: ${webhookUrl}`)

    // Prepare payload based on mode
    const payload = mode === 'simple' ? {
      jobId,
      imageUrl: publicUrl,
      userId,
      roomType,
      selectedStyle,
      customPrompt,
      quality,
      preserveArchitecture: true,
      timestamp: new Date().toISOString()
    } : {
      // Complex workflow payload (original format)
      jobId,
      imageUrl: publicUrl,
      userId,
      roomType,
      selectedStyle,
      customPrompt,
      quality,
      imageWidth: null,
      imageHeight: null,
      timestamp: new Date().toISOString()
    }

    // Trigger n8n workflow
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('❌ n8n webhook error:', errorText)
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${errorText}`)
    }

    // Try to parse JSON response, but don't fail if it's empty
    let n8nResult = null
    try {
      const responseText = await n8nResponse.text()
      if (responseText && responseText.trim()) {
        n8nResult = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.warn('⚠️ n8n response not JSON or empty, continuing anyway:', parseError)
    }
    
    console.log(`✅ ${mode} workflow triggered successfully:`, n8nResult || 'No response body')

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        message: `${mode === 'simple' ? 'Simplified' : 'Complex'} room transformation started`,
        originalImageUrl: publicUrl,
        status: 'processing',
        workflow: mode,
        estimatedTime: mode === 'simple' ? '30-60 seconds' : '2-3 minutes'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    )
  }
})

/* To test this function locally, you can use:
curl -i --location --request POST 'http://localhost:54321/functions/v1/empty-room' \
  --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
  --form 'file=@"path/to/your/image.jpg"' \
  --form 'roomType="living-room"' \
  --form 'selectedStyle="scandinavian"' \
  --form 'customPrompt="Make it cozy with lots of plants"' \
  --form 'quality="premium"' \
  --form 'mode="simple"'
*/ 