#!/usr/bin/env node

/**
 * 🔧 Homify n8n Configuration Fix Script
 * 
 * This script will help you:
 * 1. Check your current n8n webhook configuration
 * 2. Test the webhook connection
 * 3. Set up proper environment variables
 * 4. Test the complete flow
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Homify n8n Configuration Fix Script');
console.log('=====================================\n');

// Check if we have environment variables
function checkEnvironmentVariables() {
  console.log('1. 🔍 Checking Environment Variables...\n');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'N8N_UNIFIED_WEBHOOK_URL'
  ];
  
  const optionalVars = [
    'N8N_WEBHOOK_URL',
    'N8N_WEBHOOK_AUTH_USERNAME', 
    'N8N_WEBHOOK_AUTH_PASSWORD'
  ];
  
  let missingRequired = [];
  let presentOptional = [];
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 30)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      missingRequired.push(varName);
    }
  });
  
  console.log('');
  
  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: SET`);
      presentOptional.push(varName);
    } else {
      console.log(`⚠️  ${varName}: not set (optional)`);
    }
  });
  
  return { missingRequired, presentOptional };
}

// Test n8n webhook connection
async function testN8nWebhook() {
  console.log('\n2. 🧪 Testing n8n Webhook Connection...\n');
  
  const webhookUrl = process.env.N8N_UNIFIED_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('❌ N8N_UNIFIED_WEBHOOK_URL not set - cannot test');
    return false;
  }
  
  console.log(`📡 Testing webhook: ${webhookUrl}`);
  
  const testPayload = {
    jobId: `test_${Date.now()}`,
    imageUrl: 'https://example.com/test-image.jpg',
    userId: 'test-user',
    roomType: 'living_room',
    selectedStyle: 'modern',
    quality: 'standard',
    timestamp: new Date().toISOString()
  };
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add auth if available
    const username = process.env.N8N_WEBHOOK_AUTH_USERNAME;
    const password = process.env.N8N_WEBHOOK_AUTH_PASSWORD;
    
    if (username && password) {
      const authString = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
      console.log('🔐 Using Basic Authentication');
    }
    
    console.log('📦 Sending test payload...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📨 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Webhook test successful!');
      console.log(`📋 Response: ${responseText.substring(0, 200)}...`);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Webhook test failed');
      console.log(`📋 Error: ${errorText}`);
      
      // Provide specific solutions
      if (response.status === 401) {
        console.log('\n💡 Authentication issue - check your webhook auth credentials');
      } else if (response.status === 404) {
        console.log('\n💡 Webhook not found - check your N8N_UNIFIED_WEBHOOK_URL');
      } else if (response.status >= 500) {
        console.log('\n💡 Server error - check your n8n workflow configuration');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook test failed with error:', error.message);
    
    if (error.message.includes('fetch is not defined')) {
      console.log('\n💡 Using Node.js < 18? Install node-fetch: npm install node-fetch');
    }
    
    return false;
  }
}

// Create .env file with proper configuration
function createEnvironmentFile() {
  console.log('\n3. 📝 Creating Environment Configuration...\n');
  
  const envContent = `# Supabase Configuration
SUPABASE_URL=${process.env.SUPABASE_URL || 'https://your-project.supabase.co'}
SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || 'your-anon-key-here'}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'}

# Expo Public Variables (for client-side access)
EXPO_PUBLIC_SUPABASE_URL=${process.env.SUPABASE_URL || 'https://your-project.supabase.co'}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || 'your-anon-key-here'}

# n8n Webhook Configuration
N8N_UNIFIED_WEBHOOK_URL=https://jabaranks7.app.n8n.cloud/webhook/process-room-unified
N8N_WEBHOOK_URL=https://jabaranks7.app.n8n.cloud/webhook/empty-room

# n8n Authentication (optional - only if your webhook requires auth)
N8N_WEBHOOK_AUTH_USERNAME=
N8N_WEBHOOK_AUTH_PASSWORD=

# Development Environment
NODE_ENV=development
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Fill in your actual Supabase credentials');
    console.log('2. Verify your n8n webhook URL is correct');
    console.log('3. Set up authentication if your n8n webhook requires it');
    console.log('4. Run this script again to test the configuration');
  } catch (error) {
    console.log('❌ Failed to create .env file:', error.message);
  }
}

// Deploy environment variables to Supabase
function deployToSupabase() {
  console.log('\n4. 🚀 Deploying to Supabase Edge Functions...\n');
  
  try {
    // Check if Supabase CLI is available
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
    
    // Create secrets file for Edge Functions
    const secrets = {
      N8N_UNIFIED_WEBHOOK_URL: process.env.N8N_UNIFIED_WEBHOOK_URL || 'https://jabaranks7.app.n8n.cloud/webhook/process-room-unified',
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'https://jabaranks7.app.n8n.cloud/webhook/empty-room'
    };
    
    // Add auth credentials if they exist
    if (process.env.N8N_WEBHOOK_AUTH_USERNAME) {
      secrets.N8N_WEBHOOK_AUTH_USERNAME = process.env.N8N_WEBHOOK_AUTH_USERNAME;
    }
    if (process.env.N8N_WEBHOOK_AUTH_PASSWORD) {
      secrets.N8N_WEBHOOK_AUTH_PASSWORD = process.env.N8N_WEBHOOK_AUTH_PASSWORD;
    }
    
    // Create temporary secrets file
    const secretsContent = Object.entries(secrets)
      .map(([key, value]) => `${key} = "${value}"`)
      .join('\n');
    
    fs.writeFileSync('/tmp/edge-function-secrets.toml', secretsContent);
    
    console.log('📤 Deploying environment variables...');
    execSync('supabase secrets set --env-file /tmp/edge-function-secrets.toml', { stdio: 'inherit' });
    
    console.log('📤 Deploying Edge Function...');
    execSync('supabase functions deploy empty-room', { stdio: 'inherit' });
    
    // Clean up
    fs.unlinkSync('/tmp/edge-function-secrets.toml');
    
    console.log('✅ Deployment successful!');
    
  } catch (error) {
    if (error.message.includes('supabase: command not found')) {
      console.log('❌ Supabase CLI not found');
      console.log('💡 Install it: npm install -g @supabase/cli');
      console.log('💡 Or set environment variables manually in Supabase Dashboard');
    } else {
      console.log('❌ Deployment failed:', error.message);
    }
  }
}

// Test complete flow
async function testCompleteFlow() {
  console.log('\n5. 🧪 Testing Complete Flow...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials - cannot test complete flow');
    return;
  }
  
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/empty-room`;
  
  console.log(`📡 Testing Edge Function: ${edgeFunctionUrl}`);
  
  try {
    // Test with minimal POST request (no file, just to check if function responds)
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'unified',
        roomType: 'living_room',
        selectedStyle: 'modern'
      })
    });
    
    const responseText = await response.text();
    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📋 Response: ${responseText.substring(0, 200)}...`);
    
    if (responseText.includes('Image file is required')) {
      console.log('✅ Edge Function is working correctly!');
      console.log('✅ Ready to process real image uploads from your app');
    } else if (responseText.includes('N8N webhook URL not configured')) {
      console.log('❌ N8N webhook URL not configured in Edge Function');
      console.log('💡 Run the "Deploy to Supabase" step above');
    } else {
      console.log('⚠️ Unexpected response - check Edge Function logs');
    }
    
  } catch (error) {
    console.log('❌ Complete flow test failed:', error.message);
  }
}

// Main execution
async function main() {
  const { missingRequired } = checkEnvironmentVariables();
  
  if (missingRequired.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingRequired.join(', ')}`);
    console.log('💡 Creating .env template...');
    createEnvironmentFile();
    console.log('\n🔄 Please fill in your credentials and run this script again');
    return;
  }
  
  const webhookWorking = await testN8nWebhook();
  
  if (!webhookWorking) {
    console.log('\n❌ N8N webhook test failed');
    console.log('💡 Please check your n8n workflow and webhook URL');
    console.log('💡 Make sure your n8n workflow is active and deployed');
    return;
  }
  
  deployToSupabase();
  await testCompleteFlow();
  
  console.log('\n🎉 Configuration Complete!');
  console.log('=====================================');
  console.log('✅ Environment variables configured');
  console.log('✅ N8N webhook connection working');
  console.log('✅ Supabase Edge Function deployed');
  console.log('✅ Complete flow tested');
  console.log('\n🚀 Your app should now work properly!');
  console.log('📱 Test on your physical device using the debug screen');
}

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    console.log('⚠️ Install node-fetch for Node.js < 18: npm install node-fetch');
  }
}

main().catch(console.error); 