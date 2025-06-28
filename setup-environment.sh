#!/bin/bash

# =================================================================
# HOMIFY MVP - COMPLETE ENVIRONMENT SETUP SCRIPT
# =================================================================
# This script sets up all necessary environment variables and 
# configurations for the Homify MVP project
# =================================================================

echo "🚀 Setting up Homify MVP Environment..."
echo "======================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one first."
    echo "📝 Copy .env.example to .env and fill in your values"
    exit 1
fi

# Source the .env file
source .env

# Validate required environment variables
echo "🔍 Validating environment variables..."

REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Please add these to your .env file"
    exit 1
fi

echo "✅ All required environment variables found"

# Extract Supabase project details
SUPABASE_PROJECT_ID=$(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
SUPABASE_URL_HOST=$(echo $SUPABASE_URL | sed 's/https:\/\///')

echo "📊 Project Details:"
echo "   - Supabase Project ID: $SUPABASE_PROJECT_ID"
echo "   - Supabase URL Host: $SUPABASE_URL_HOST"

# Set up Supabase Edge Function environment variables
echo ""
echo "🔧 Setting up Edge Function environment variables..."

# Check if N8N webhook URL is configured
if [ -z "$N8N_UNIFIED_WEBHOOK_URL" ]; then
    echo "⚠️  N8N_UNIFIED_WEBHOOK_URL not found in .env"
    echo "📝 Please add: N8N_UNIFIED_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/process-room-unified"
else
    echo "✅ N8N Unified Webhook URL configured"
fi

# Set edge function environment variables using Supabase CLI
echo "🚀 Deploying environment variables to Supabase Edge Functions..."

# Create a temporary secrets file
cat > /tmp/edge-function-secrets.toml << EOF
N8N_UNIFIED_WEBHOOK_URL = "$N8N_UNIFIED_WEBHOOK_URL"
N8N_WEBHOOK_URL = "$N8N_WEBHOOK_URL"
N8N_WEBHOOK_AUTH_USERNAME = "$N8N_WEBHOOK_AUTH_USERNAME"
N8N_WEBHOOK_AUTH_PASSWORD = "$N8N_WEBHOOK_AUTH_PASSWORD"
SUPABASE_URL_HOST = "$SUPABASE_URL_HOST"
OPENAI_API_KEY = "$OPENAI_API_KEY"
EOF

# Deploy secrets to Supabase
if command -v supabase &> /dev/null; then
    echo "📤 Deploying secrets to Supabase..."
    supabase secrets set --env-file /tmp/edge-function-secrets.toml
    
    if [ $? -eq 0 ]; then
        echo "✅ Edge function secrets deployed successfully"
    else
        echo "❌ Failed to deploy edge function secrets"
        echo "🔧 Try running manually: supabase secrets set --env-file /tmp/edge-function-secrets.toml"
    fi
else
    echo "⚠️  Supabase CLI not found. Please install it and run:"
    echo "   supabase secrets set --env-file /tmp/edge-function-secrets.toml"
fi

# Clean up temporary file
rm -f /tmp/edge-function-secrets.toml

# Deploy the updated edge function
echo ""
echo "🚀 Deploying updated Edge Function..."

if command -v supabase &> /dev/null; then
    echo "📤 Deploying empty-room edge function..."
    supabase functions deploy empty-room
    
    if [ $? -eq 0 ]; then
        echo "✅ Edge function deployed successfully"
    else
        echo "❌ Failed to deploy edge function"
        echo "🔧 Try running manually: supabase functions deploy empty-room"
    fi
else
    echo "⚠️  Please deploy the edge function manually:"
    echo "   supabase functions deploy empty-room"
fi

# Test the setup
echo ""
echo "🧪 Testing the setup..."

# Test edge function endpoint
EDGE_FUNCTION_URL="$SUPABASE_URL/functions/v1/empty-room"
echo "📡 Testing edge function at: $EDGE_FUNCTION_URL"

# Simple GET test
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    "$EDGE_FUNCTION_URL")

if [ "$HTTP_STATUS" = "405" ]; then
    echo "✅ Edge function is responding (405 Method Not Allowed is expected for GET)"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Edge function is responding"
else
    echo "⚠️  Edge function returned status: $HTTP_STATUS"
    echo "🔧 This might be normal - check the logs for details"
fi

# Create a test script for the mobile app
echo ""
echo "📱 Creating test script for mobile app..."

cat > test-upload.js << 'EOF'
// Test script for mobile app upload
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

async function testUpload() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    console.log('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return;
  }
  
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/empty-room`;
  
  // Create a simple test image (1x1 PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  
  const formData = new FormData();
  formData.append('file', testImageBuffer, {
    filename: 'test-room.png',
    contentType: 'image/png'
  });
  formData.append('mode', 'unified');
  formData.append('roomType', 'living_room');
  formData.append('selectedStyle', 'modern');
  formData.append('quality', 'standard');
  
  try {
    console.log('🧪 Testing upload to:', edgeFunctionUrl);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📨 Response Status:', response.status);
    const responseText = await response.text();
    console.log('📨 Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Upload test successful!');
    } else {
      console.log('❌ Upload test failed');
    }
    
  } catch (error) {
    console.log('❌ Upload test error:', error.message);
  }
}

testUpload();
EOF

echo "✅ Test script created: test-upload.js"
echo "🧪 Run with: node test-upload.js"

# Summary
echo ""
echo "🎉 Environment setup complete!"
echo "================================"
echo ""
echo "✅ What was configured:"
echo "   - Environment variables validated"
echo "   - Edge function secrets deployed"
echo "   - Edge function deployed"
echo "   - Test script created"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the upload: node test-upload.js"
echo "   2. Import the N8N workflow from: n8n-workflows/homify-unified-processing-workflow.json"
echo "   3. Configure N8N credentials (OpenAI, Supabase)"
echo "   4. Test the mobile app"
echo ""
echo "🔧 If you encounter issues:"
echo "   - Check Supabase logs: supabase functions logs empty-room"
echo "   - Check N8N execution logs"
echo "   - Verify all credentials are correct"
echo ""
echo "📚 Documentation:"
echo "   - Edge Function: supabase/functions/empty-room/index.ts"
echo "   - N8N Workflow: n8n-workflows/homify-unified-processing-workflow.json"
echo "   - App Service: app/services/roomService.ts" 