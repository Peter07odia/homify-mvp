const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createRoomsBucket() {
  console.log('🏗️  Creating Missing "rooms" Bucket');
  console.log('===================================\n');
  
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
    console.log('1. Checking if "rooms" bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return;
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === 'rooms');
    
    if (existingBucket) {
      console.log('✅ "rooms" bucket already exists');
    } else {
      // Create the bucket
      console.log('2. Creating "rooms" bucket...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('rooms', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.log('❌ Error creating bucket:', createError.message);
        return;
      }
      
      console.log('✅ Created "rooms" bucket successfully');
    }
    
    // Create the required folder structure
    console.log('3. Creating folder structure...');
    const folders = ['original', 'empty', 'clean', 'styled'];
    
    for (const folder of folders) {
      const placeholderPath = `${folder}/.placeholder`;
      
      // Create a minimal placeholder file
      const placeholderContent = `# ${folder} folder\nThis folder stores ${folder} room images.`;
      
      const { error: uploadError } = await supabase.storage
        .from('rooms')
        .upload(placeholderPath, placeholderContent, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        console.log(`⚠️  Could not create ${folder} folder:`, uploadError.message);
      } else {
        console.log(`✅ Created ${folder}/ folder`);
      }
    }
    
    // Test upload to verify everything works
    console.log('4. Testing upload to verify setup...');
    const testFileName = `test-${Date.now()}.png`;
    const testFilePath = `original/${testFileName}`;
    
    // Create a minimal 1x1 PNG image as base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rooms')
      .upload(testFilePath, testImageBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      return;
    }
    
    console.log('✅ Upload test successful');
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('rooms')
      .getPublicUrl(testFilePath);
    
    console.log('✅ Public URL test:', urlData.publicUrl);
    
    // Clean up test file
    await supabase.storage.from('rooms').remove([testFilePath]);
    console.log('✅ Cleaned up test file');
    
    console.log('\n🎉 "rooms" bucket setup complete!');
    console.log('📋 Bucket details:');
    console.log('   Name: rooms');
    console.log('   Public: Yes');
    console.log('   Folders: original/, empty/, clean/, styled/');
    console.log('   Allowed types: image/jpeg, image/png, image/webp');
    console.log('   Size limit: 10MB');
    console.log('\n🚀 Your Edge Function should now work!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have SUPABASE_SERVICE_ROLE_KEY in your .env file');
    console.log('2. Check if your Supabase project is active');
    console.log('3. Verify you have storage permissions in your project');
  }
}

createRoomsBucket(); 