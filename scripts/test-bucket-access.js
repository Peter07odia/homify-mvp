const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

async function testBucketAccess() {
  console.log('🧪 Testing Homify Bucket Access & Workflow Configuration');
  console.log('=======================================================\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    console.log('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. List all buckets
    console.log('1. 📋 Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
    });
    
    // 2. Check specific buckets we need
    const requiredBuckets = ['room-images', 'rooms'];
    const existingBucketNames = buckets.map(b => b.name);
    
    console.log('\n2. 🔍 Checking required buckets...');
    for (const bucketName of requiredBuckets) {
      if (existingBucketNames.includes(bucketName)) {
        console.log(`✅ ${bucketName} bucket exists`);
        
        // List folders in the bucket
        try {
          const { data: objects } = await supabase.storage.from(bucketName).list('', { limit: 100 });
          if (objects) {
            const folders = objects.filter(obj => obj.name.endsWith('/') || !obj.name.includes('.'));
            console.log(`   📁 Folders: ${folders.map(f => f.name).join(', ') || 'None'}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Could not list contents: ${e.message}`);
        }
      } else {
        console.log(`❌ ${bucketName} bucket missing`);
      }
    }
    
    // 3. Test upload to room-images bucket
    console.log('\n3. 📤 Testing upload to room-images bucket...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Homify test upload';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('room-images')
      .upload(`original/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
    } else {
      console.log('✅ Upload test successful');
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(`original/${testFileName}`);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      // Clean up
      await supabase.storage.from('room-images').remove([`original/${testFileName}`]);
      console.log('✅ Test file cleaned up');
    }
    
    // 4. Check recent processed images
    console.log('\n4. 🖼️  Checking for recent processed images...');
    const { data: processedFiles } = await supabase.storage
      .from('room-images')
      .list('processed', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (processedFiles && processedFiles.length > 0) {
      console.log(`Found ${processedFiles.length} processed images:`);
      processedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${new Date(file.created_at).toLocaleString()})`);
      });
    } else {
      console.log('No processed images found');
    }
    
    // 5. Check rooms bucket as well
    console.log('\n5. 🏠 Checking rooms bucket for legacy processed images...');
    const { data: legacyFiles } = await supabase.storage
      .from('rooms')
      .list('transformed', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (legacyFiles && legacyFiles.length > 0) {
      console.log(`Found ${legacyFiles.length} legacy transformed images:`);
      legacyFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${new Date(file.created_at).toLocaleString()})`);
      });
    } else {
      console.log('No legacy transformed images found');
    }
    
    console.log('\n🎉 Bucket access test completed!');
    console.log('\n📋 Summary:');
    console.log('- Original images upload to: room-images/original/');
    console.log('- Processed images should be saved to: room-images/processed/');
    console.log('- Legacy images may be in: rooms/transformed/');
    console.log('- App looks for results in both locations');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBucketAccess(); 