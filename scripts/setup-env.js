#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function setupEnvironment() {
  console.log('🏠 Homify Environment Setup');
  console.log('============================\n');
  
  console.log('This script will help you configure your .env file for the Homify app.');
  console.log('You\'ll need your Supabase project credentials and n8n webhook URLs.\n');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    const overwrite = await question('A .env file already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  console.log('\n📋 Please provide the following information:\n');
  
  // Supabase Configuration
  console.log('1. Supabase Configuration');
  console.log('   Go to your Supabase project > Settings > API\n');
  
  const supabaseUrl = await question('   Supabase Project URL (e.g., https://your-project.supabase.co): ');
  const supabaseAnonKey = await question('   Supabase Anon Key: ');
  const supabaseServiceKey = await question('   Supabase Service Role Key (optional): ');
  
  // n8n Configuration
  console.log('\n2. n8n Webhook Configuration');
  console.log('   These are the webhook URLs from your n8n workflows\n');
  
  const n8nWebhookUrl = await question('   n8n Empty Room Webhook URL: ');
  const n8nStyleWebhookUrl = await question('   n8n Style Webhook URL (optional): ');
  
  // Generate .env content
  const envContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey || 'your-service-role-key-here'}

# Expo Public Variables (for client-side access)
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# n8n Webhook URLs
N8N_WEBHOOK_URL=${n8nWebhookUrl}
N8N_STYLE_WEBHOOK_URL=${n8nStyleWebhookUrl || 'https://your-n8n-instance.app.n8n.cloud/webhook/style-room'}

# Development Environment
NODE_ENV=development
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your Supabase Edge Function is deployed');
    console.log('2. Set up your n8n workflows');
    console.log('3. Test the image processing functionality');
    console.log('\n📖 For detailed setup instructions, see:');
    console.log('   - SETUP_GUIDE.md');
    console.log('   - SUPABASE_N8N_SETUP.md');
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }
  
  rl.close();
}

// Validate Supabase URL format
function isValidSupabaseUrl(url) {
  return url && url.startsWith('https://') && url.includes('.supabase.co');
}

// Validate webhook URL format
function isValidWebhookUrl(url) {
  return url && url.startsWith('https://') && url.includes('webhook');
}

if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment }; 