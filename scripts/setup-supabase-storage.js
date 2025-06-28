#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSupabaseStorage() {
  console.log('🗄️  Setting up Supabase Storage for Room Images');
  console.log('===============================================\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    console.log('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if bucket already exists
    console.log('1. Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }
    
    const bucketName = 'room-images';
    const existingBucket = buckets.find(bucket => bucket.name === bucketName);
    
    if (existingBucket) {
      console.log('✅ Bucket "room-images" already exists');
    } else {
      // Create the bucket
      console.log('2. Creating "room-images" bucket...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.log('❌ Error creating bucket:', createError.message);
        return;
      }
      
      console.log('✅ Created bucket "room-images"');
    }
    
    // Test upload to verify permissions
    console.log('3. Testing upload permissions...');
    const testFileName = `test-${Date.now()}.png`;
    // Create a minimal 1x1 PNG image as base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      console.log('💡 You may need to use SUPABASE_SERVICE_ROLE_KEY instead of SUPABASE_ANON_KEY');
      return;
    }
    
    console.log('✅ Upload test successful');
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
    
    console.log('✅ Public URL test:', urlData.publicUrl);
    
    // Clean up test file
    await supabase.storage.from(bucketName).remove([testFileName]);
    console.log('✅ Cleaned up test file');
    
    console.log('\n🎉 Supabase Storage setup complete!');
    console.log('📋 Bucket details:');
    console.log(`   Name: ${bucketName}`);
    console.log(`   Public: Yes`);
    console.log(`   Allowed types: image/jpeg, image/png, image/webp`);
    console.log(`   Size limit: 10MB`);
    console.log('\n🚀 Ready for HTTP URL uploads!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupSupabaseStorage(); 