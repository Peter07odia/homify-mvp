require('dotenv').config();

async function testEdgeFunctionN8nCall() {
  console.log('🧪 Testing Edge Function n8n Call Simulation');
  console.log('============================================\n');
  
  const webhookUrl = process.env.N8N_UNIFIED_WEBHOOK_URL;
  const username = process.env.N8N_WEBHOOK_AUTH_USERNAME;
  const password = process.env.N8N_WEBHOOK_AUTH_PASSWORD;
  
  console.log('🔗 Webhook URL:', webhookUrl);
  console.log('👤 Username available:', !!username);
  console.log('🔑 Password available:', !!password);
  
  if (!webhookUrl) {
    console.log('❌ N8N_UNIFIED_WEBHOOK_URL not found in environment');
    return;
  }
  
  // Simulate the exact payload the Edge Function sends
  const webhookPayload = {
    jobId: `test_edge_simulation_${Date.now()}`,
    imageUrl: 'https://avsfthvjoueoohlegagx.supabase.co/storage/v1/object/public/rooms/original/test-image.png',
    userId: 'test-user-id',
    roomType: 'living_room',
    selectedStyle: 'modern',
    quality: 'standard',
    imageWidth: 800,
    imageHeight: 600,
    timestamp: new Date().toISOString()
  };
  
  console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2));
  
  // Prepare headers exactly like the Edge Function does
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add Basic Authentication if credentials are provided (like Edge Function does)
  if (username && password) {
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
    console.log('🔐 Added Basic Auth header');
  } else {
    console.log('🔓 No authentication credentials found');
  }
  
  console.log('📡 Headers:', Object.keys(headers));
  
  try {
    console.log('\n🚀 Making request to n8n webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(webhookPayload)
    });
    
    console.log('📨 Response Status:', response.status, response.statusText);
    console.log('📨 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      
      if (response.status === 401) {
        console.log('💡 This is an authentication error');
        console.log('💡 Your n8n webhook might require different credentials');
      } else if (response.status === 403) {
        console.log('💡 This is a permission error');
        console.log('💡 Check your n8n webhook permissions');
      } else if (response.status === 404) {
        console.log('💡 Webhook not found - check the URL');
      }
      
      return;
    }
    
    const responseText = await response.text();
    console.log('✅ Success Response:', responseText);
    
    console.log('\n🎉 n8n webhook call successful!');
    console.log('✅ Your Edge Function should work with these settings');
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 This might be a network connectivity issue');
    }
  }
}

testEdgeFunctionN8nCall(); 