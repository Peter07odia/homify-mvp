import { testWebhookConnection, debugWebhookConnection } from '../services/roomService';

/**
 * Comprehensive webhook connection test
 * Run this to diagnose connection issues
 */
export const runWebhookDiagnostics = async (): Promise<void> => {
  console.log('🔍 Starting Webhook Diagnostics...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Basic connectivity
    console.log('📡 Test 1: Basic connectivity test...');
    const isConnected = await testWebhookConnection();
    console.log(`Result: ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);
    
    // Test 2: Detailed debugging
    console.log('\n📋 Test 2: Detailed connection debugging...');
    await debugWebhookConnection();
    
    // Test 3: Network environment check
    console.log('\n🌐 Test 3: Network environment check...');
    await checkNetworkEnvironment();
    
    // Test 4: URL validation
    console.log('\n🔗 Test 4: URL validation...');
    validateWebhookUrl();
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Webhook diagnostics complete');
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
  }
};

/**
 * Check the network environment and capabilities
 */
const checkNetworkEnvironment = async (): Promise<void> => {
  try {
    // Test basic internet connectivity
    console.log('  Testing basic internet connectivity...');
    const googleResponse = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000,
    });
    console.log(`  Google reachable: ${googleResponse.ok ? '✅' : '❌'}`);
    
    // Test HTTPS capabilities
    console.log('  Testing HTTPS capabilities...');
    const httpsResponse = await fetch('https://httpbin.org/status/200', {
      method: 'GET',
      timeout: 5000,
    });
    console.log(`  HTTPS working: ${httpsResponse.ok ? '✅' : '❌'}`);
    
    // Test if we can reach the N8N domain
    console.log('  Testing N8N domain reachability...');
    try {
      const n8nDomainResponse = await fetch('https://jabaranks7.app.n8n.cloud', {
        method: 'HEAD',
        timeout: 10000,
      });
      console.log(`  N8N domain reachable: ${n8nDomainResponse.ok ? '✅' : '❌'}`);
      console.log(`  N8N domain status: ${n8nDomainResponse.status}`);
    } catch (domainError) {
      console.log(`  N8N domain error: ❌ ${domainError.message}`);
    }
    
  } catch (error) {
    console.error('  Network environment check failed:', error);
  }
};

/**
 * Validate the webhook URL format and structure
 */
const validateWebhookUrl = (): void => {
  const webhookUrl = 'https://jabaranks7.app.n8n.cloud/webhook/empty-room';
  
  try {
    const url = new URL(webhookUrl);
    console.log(`  URL format: ✅ Valid`);
    console.log(`  Protocol: ${url.protocol}`);
    console.log(`  Hostname: ${url.hostname}`);
    console.log(`  Pathname: ${url.pathname}`);
    console.log(`  Full URL: ${url.href}`);
    
    // Check if URL follows N8N webhook pattern
    if (url.hostname.includes('n8n.cloud') && url.pathname.startsWith('/webhook/')) {
      console.log(`  N8N pattern: ✅ Matches expected pattern`);
    } else {
      console.log(`  N8N pattern: ⚠️  Doesn't match typical N8N webhook pattern`);
    }
    
  } catch (error) {
    console.log(`  URL format: ❌ Invalid - ${error.message}`);
  }
};

/**
 * Test with specific error scenarios
 */
export const testSpecificScenarios = async (): Promise<void> => {
  console.log('🧪 Testing Specific Error Scenarios...');
  console.log('='.repeat(50));
  
  // Scenario 1: Test with timeout
  console.log('⏱️  Scenario 1: Testing with short timeout...');
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    await fetch('https://jabaranks7.app.n8n.cloud/webhook/empty-room', {
      method: 'HEAD',
      signal: controller.signal,
    });
    console.log('  Short timeout test: ✅ Passed');
  } catch (error) {
    console.log(`  Short timeout test: ❌ ${error.message}`);
  }
  
  // Scenario 2: Test CORS
  console.log('\n🌐 Scenario 2: Testing CORS behavior...');
  try {
    const corsResponse = await fetch('https://jabaranks7.app.n8n.cloud/webhook/empty-room', {
      method: 'OPTIONS',
    });
    console.log(`  CORS preflight: ${corsResponse.ok ? '✅' : '❌'} (${corsResponse.status})`);
    console.log(`  CORS headers:`, Object.fromEntries(corsResponse.headers.entries()));
  } catch (error) {
    console.log(`  CORS test: ❌ ${error.message}`);
  }
  
  // Scenario 3: Test with actual POST (but empty body)
  console.log('\n📤 Scenario 3: Testing POST endpoint...');
  try {
    const postResponse = await fetch('https://jabaranks7.app.n8n.cloud/webhook/empty-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    const responseText = await postResponse.text();
    console.log(`  POST test: ${postResponse.ok ? '✅' : '❌'} (${postResponse.status})`);
    console.log(`  Response body: ${responseText.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`  POST test: ❌ ${error.message}`);
  }
};

/**
 * Quick connectivity check that can be called from the UI
 */
export const quickConnectivityCheck = async (): Promise<{
  isConnected: boolean;
  error?: string;
  details: string[];
}> => {
  const details: string[] = [];
  
  try {
    // Quick internet check
    details.push('Testing internet connectivity...');
    await fetch('https://www.google.com', { method: 'HEAD', timeout: 3000 });
    details.push('✅ Internet connection OK');
    
    // Quick N8N check
    details.push('Testing N8N webhook...');
    const webhookTest = await testWebhookConnection();
    
    if (webhookTest) {
      details.push('✅ N8N webhook reachable');
      return { isConnected: true, details };
    } else {
      details.push('❌ N8N webhook not reachable');
      return { isConnected: false, error: 'Webhook not accessible', details };
    }
    
  } catch (error) {
    details.push(`❌ Connection test failed: ${error.message}`);
    return { 
      isConnected: false, 
      error: error.message || 'Unknown connection error',
      details 
    };
  }
}; 