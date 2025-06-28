#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Homify Environment Verification');
console.log('==================================\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
];

const warnings = [];
const errors = [];

// Check required environment variables
requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    errors.push(`❌ ${varName} is missing`);
  } else if (value.includes('your-project-id') || value.includes('your-actual-')) {
    warnings.push(`⚠️  ${varName} still contains placeholder text`);
  } else {
    console.log(`✅ ${varName} is configured`);
  }
});

// Check optional but recommended variables
const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'EXPO_PUBLIC_N8N_UNIFIED_WEBHOOK_URL',
  'N8N_UNIFIED_WEBHOOK_URL'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value || value.includes('your-')) {
    console.log(`⚪ ${varName} not configured (optional)`);
  } else {
    console.log(`✅ ${varName} is configured`);
  }
});

// Validate Supabase URL format
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  warnings.push(`⚠️  SUPABASE_URL doesn't look like a valid Supabase URL`);
}

// Check if public and private versions match
if (process.env.SUPABASE_URL !== process.env.EXPO_PUBLIC_SUPABASE_URL) {
  warnings.push(`⚠️  SUPABASE_URL and EXPO_PUBLIC_SUPABASE_URL don't match`);
}

if (process.env.SUPABASE_ANON_KEY !== process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  warnings.push(`⚠️  SUPABASE_ANON_KEY and EXPO_PUBLIC_SUPABASE_ANON_KEY don't match`);
}

console.log('\n📋 Summary:');
console.log('===========');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All good! Your environment is properly configured.');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your Expo development server');
  console.log('2. Follow DATABASE_RESET_GUIDE.md to reset your database');
  console.log('3. Test your app - the fetch error should be gone!');
} else {
  if (errors.length > 0) {
    console.log('\n🚨 Critical Issues:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n🔧 To fix:');
  console.log('1. Edit your .env file');
  console.log('2. Fill in your actual Supabase credentials');
  console.log('3. Run this script again: node verify-setup.js');
}

console.log('\n💡 Need help? Check QUICK_SETUP_GUIDE.md'); 