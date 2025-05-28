// Script to optimize onboarding images
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ASSETS_DIR = path.join(__dirname, '../app/assets');
const OUTPUT_DIR = path.join(__dirname, '../app/assets/optimized');
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 80;

// Supported image formats
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Get file size in MB
 */
function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

/**
 * Optimize a single image
 */
function optimizeImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  try {
    if (ext === '.png') {
      // Optimize PNG with pngquant
      execSync(`pngquant --quality=65-${QUALITY} --output "${outputPath}" "${inputPath}"`, { stdio: 'inherit' });
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      // Optimize JPEG with imagemagick or similar
      execSync(`convert "${inputPath}" -quality ${QUALITY} -resize ${MAX_WIDTH}x${MAX_HEIGHT}> "${outputPath}"`, { stdio: 'inherit' });
    }
    
    const originalSize = getFileSizeMB(inputPath);
    const optimizedSize = getFileSizeMB(outputPath);
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${originalSize}MB → ${optimizedSize}MB (${savings}% savings)`);
    
    return {
      original: originalSize,
      optimized: optimizedSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return null;
  }
}

/**
 * Convert image to WebP format
 */
function convertToWebP(inputPath, outputPath) {
  try {
    const webpPath = outputPath.replace(path.extname(outputPath), '.webp');
    execSync(`cwebp -q ${QUALITY} "${inputPath}" -o "${webpPath}"`, { stdio: 'inherit' });
    
    const originalSize = getFileSizeMB(inputPath);
    const webpSize = getFileSizeMB(webpPath);
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    
    console.log(`🔄 WebP ${path.basename(inputPath)}: ${originalSize}MB → ${webpSize}MB (${savings}% savings)`);
    
    return {
      original: originalSize,
      webp: webpSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath} to WebP:`, error.message);
    return null;
  }
}

/**
 * Recursively find all images in directory
 */
function findImages(dir) {
  const images = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'optimized') {
        scanDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  }
  
  scanDir(dir);
  return images;
}

/**
 * Main optimization function
 */
async function optimizeAssets() {
  console.log('🚀 Starting image optimization...\n');
  
  // Check if required tools are installed
  try {
    execSync('which pngquant', { stdio: 'ignore' });
  } catch {
    console.log('📦 Installing pngquant...');
    try {
      execSync('brew install pngquant', { stdio: 'inherit' });
    } catch {
      console.error('❌ Please install pngquant: brew install pngquant');
      process.exit(1);
    }
  }
  
  try {
    execSync('which cwebp', { stdio: 'ignore' });
  } catch {
    console.log('📦 Installing webp...');
    try {
      execSync('brew install webp', { stdio: 'inherit' });
    } catch {
      console.error('❌ Please install webp: brew install webp');
      process.exit(1);
    }
  }
  
  const images = findImages(ASSETS_DIR);
  console.log(`Found ${images.length} images to optimize\n`);
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let totalWebPSize = 0;
  
  for (const imagePath of images) {
    const relativePath = path.relative(ASSETS_DIR, imagePath);
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputDir = path.dirname(outputPath);
    
    // Create output directory structure
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get original size
    const originalSize = parseFloat(getFileSizeMB(imagePath));
    totalOriginalSize += originalSize;
    
    // Optimize image
    const optimizeResult = optimizeImage(imagePath, outputPath);
    if (optimizeResult) {
      totalOptimizedSize += parseFloat(optimizeResult.optimized);
    }
    
    // Convert to WebP
    const webpResult = convertToWebP(imagePath, outputPath);
    if (webpResult) {
      totalWebPSize += parseFloat(webpResult.webp);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('========================');
  console.log(`Original total size: ${totalOriginalSize.toFixed(2)}MB`);
  console.log(`Optimized total size: ${totalOptimizedSize.toFixed(2)}MB`);
  console.log(`WebP total size: ${totalWebPSize.toFixed(2)}MB`);
  console.log(`Total savings (optimized): ${((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log(`Total savings (WebP): ${((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log(`\n✅ Optimization complete! Check the 'optimized' folder.`);
  
  // Generate usage instructions
  console.log('\n📝 USAGE INSTRUCTIONS:');
  console.log('1. Replace original images with optimized versions');
  console.log('2. Use WebP images where supported');
  console.log('3. Update import paths in your components');
  console.log('4. Consider implementing progressive loading');
}

// Run optimization
if (require.main === module) {
  optimizeAssets().catch(console.error);
}

module.exports = { optimizeAssets, optimizeImage, convertToWebP }; 