#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkExistingStorage() {
  console.log('🔍 Checking Your Existing Supabase Storage Setup');
  console.log('===============================================\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // List all existing buckets
    console.log('📋 Your existing storage buckets:');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }
    
    if (buckets.length === 0) {
      console.log('   No buckets found');
    } else {
      buckets.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      });
    }
    
    // Check for common bucket names that might be used for images
    const imageBuckets = buckets.filter(bucket => 
      bucket.name.includes('image') || 
      bucket.name.includes('photo') || 
      bucket.name.includes('room') ||
      bucket.name.includes('upload')
    );
    
    if (imageBuckets.length > 0) {
      console.log('\n🖼️  Image-related buckets found:');
      for (const bucket of imageBuckets) {
        console.log(`   📁 ${bucket.name}`);
        
        // Check contents of each image bucket
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 5 });
          
          if (!filesError && files) {
            console.log(`      Files: ${files.length} items`);
            if (files.length > 0) {
              files.slice(0, 3).forEach(file => {
                console.log(`      - ${file.name}`);
              });
              if (files.length > 3) {
                console.log(`      - ... and ${files.length - 3} more`);
              }
            }
          }
        } catch (e) {
          console.log(`      Could not list files: ${e.message}`);
        }
      }
    }
    
    console.log('\n❓ Which bucket should I use for the HTTP URL approach?');
    console.log('Please let me know:');
    console.log('1. The name of your existing bucket for room images');
    console.log('2. Or if you want me to use a specific bucket structure');
    console.log('\nI\'ll update the Edge Function to use your existing setup!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkExistingStorage(); 