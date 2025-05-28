const https = require('https');
const fs = require('fs');
const path = require('path');

// Room types and styles from your app
const ROOM_TYPES = ['bedroom', 'living-room', 'kitchen', 'dining-room', 'bathroom', 'home-office'];
const STYLES = ['minimal', 'modern', 'bohemian', 'scandinavian', 'industrial', 'botanical'];

// High-quality furnished room images from Unsplash - specific to each room type and style
const IMAGE_SOURCES = {
  bedroom: {
    minimal: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Minimal white bedroom
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Clean minimal bedroom
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Simple bedroom design
    ],
    modern: [
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80', // Modern bedroom with art
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80', // Contemporary bedroom
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'  // Modern bedroom design
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Light wood bedroom
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Nordic style bedroom
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Scandinavian bedroom
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Boho bedroom with textiles
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Bohemian style bedroom
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Eclectic bedroom
    ],
    industrial: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Industrial loft bedroom
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Raw industrial bedroom
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Urban bedroom design
    ],
    botanical: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Bedroom with plants
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Green botanical bedroom
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Nature-inspired bedroom
    ]
  },
  'living-room': {
    minimal: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Minimal living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Clean living space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Simple living room
    ],
    modern: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Modern living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Contemporary living space
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80'  // Sleek living room
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Scandinavian living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Nordic living space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Light wood living room
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Boho living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Eclectic living space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Colorful living room
    ],
    industrial: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Industrial living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Loft-style living space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Urban living room
    ],
    botanical: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Plant-filled living room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Green living space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Nature-inspired living room
    ]
  },
  kitchen: {
    minimal: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Minimal white kitchen
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Clean kitchen design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Simple kitchen
    ],
    modern: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Modern kitchen island
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Contemporary kitchen
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Sleek kitchen design
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Light wood kitchen
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Nordic kitchen design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Scandinavian kitchen
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Colorful boho kitchen
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Eclectic kitchen design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Bohemian kitchen
    ],
    industrial: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Industrial kitchen
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Raw kitchen design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Urban kitchen
    ],
    botanical: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Kitchen with plants
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Green kitchen design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'  // Nature-inspired kitchen
    ]
  },
  'dining-room': {
    minimal: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Minimal dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Clean dining space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Simple dining room
    ],
    modern: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Modern dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Contemporary dining space
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80'  // Sleek dining room
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Scandinavian dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Nordic dining space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Light wood dining room
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Boho dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Eclectic dining space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Colorful dining room
    ],
    industrial: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Industrial dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Loft-style dining space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Urban dining room
    ],
    botanical: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Plant-filled dining room
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Green dining space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Nature-inspired dining room
    ]
  },
  bathroom: {
    minimal: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Minimal bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Clean bathroom design
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Simple bathroom
    ],
    modern: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Modern bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Contemporary bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Sleek bathroom design
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Scandinavian bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Nordic bathroom design
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Light wood bathroom
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Boho bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Eclectic bathroom design
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Colorful bathroom
    ],
    industrial: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Industrial bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Raw bathroom design
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Urban bathroom
    ],
    botanical: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Bathroom with plants
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Green bathroom design
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80'  // Nature-inspired bathroom
    ]
  },
  'home-office': {
    minimal: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Minimal home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Clean office space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Simple home office
    ],
    modern: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Modern home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Contemporary office space
      'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80'  // Sleek home office
    ],
    scandinavian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Scandinavian home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Nordic office space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Light wood home office
    ],
    bohemian: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Boho home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Eclectic office space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Colorful home office
    ],
    industrial: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Industrial home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Loft-style office space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Urban home office
    ],
    botanical: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Plant-filled home office
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Green office space
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'  // Nature-inspired home office
    ]
  }
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filepath}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('Starting room image downloads...');
  
  for (const roomType of ROOM_TYPES) {
    for (const style of STYLES) {
      const urls = IMAGE_SOURCES[roomType]?.[style] || [];
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const filename = `${style}-${roomType}-${i + 1}.jpg`;
        const filepath = path.join('app', 'assets', 'room-images', roomType, style, filename);
        
        try {
          await downloadImage(url, filepath);
          // Add a small delay to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to download ${url}:`, error.message);
        }
      }
    }
  }
  
  console.log('All downloads completed!');
}

// Run the download script
downloadAllImages().catch(console.error); 