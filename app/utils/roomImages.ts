// Room image utility for managing room type and style specific images
export type RoomType = 
  | 'bedroom' 
  | 'living-room' 
  | 'kitchen' 
  | 'outdoor-space' 
  | 'baby-kids-room' 
  | 'bathroom' 
  | 'closet' 
  | 'store' 
  | 'home-office' 
  | 'home-cinema' 
  | 'cafe-bar' 
  | 'garage' 
  | 'hallway' 
  | 'dining-room' 
  | 'gym' 
  | 'laundry-room' 
  | 'reception-area' 
  | 'office';

export type StyleType = 
  | 'contemporary' 
  | 'classic' 
  | 'transitional' 
  | 'mid-century-modern' 
  | 'industrial' 
  | 'scandinavian' 
  | 'boho' 
  | 'shabby-chic' 
  | 'mediterranean' 
  | 'oriental' 
  | 'asian' 
  | 'wabi-sabi' 
  | 'retro' 
  | 'eclectic' 
  | 'rustic' 
  | 'farmhouse' 
  | 'memphis' 
  | 'craftsman' 
  | 'victorian' 
  | 'coastal-beach' 
  | 'southwestern' 
  | 'seventies' 
  | 'tropical';

// Fallback image for when specific images aren't available
const fallbackImage = require('../assets/emptyroom.png');

// Simplified image mappings - using fallback until user provides actual images
const roomImageMappings: Record<RoomType, Record<StyleType, any[]>> = {};

// Initialize all room types and styles with fallback images
const allRoomTypes: RoomType[] = [
  'bedroom', 'living-room', 'kitchen', 'outdoor-space', 'baby-kids-room', 
  'bathroom', 'closet', 'store', 'home-office', 'home-cinema', 'cafe-bar', 
  'garage', 'hallway', 'dining-room', 'gym', 'laundry-room', 'reception-area', 'office'
];

const allStyles: StyleType[] = [
  'contemporary', 'classic', 'transitional', 'mid-century-modern', 'industrial', 
  'scandinavian', 'boho', 'shabby-chic', 'mediterranean', 'oriental', 'asian', 
  'wabi-sabi', 'retro', 'eclectic', 'rustic', 'farmhouse', 'memphis', 'craftsman', 
  'victorian', 'coastal-beach', 'southwestern', 'seventies', 'tropical'
];

// Initialize mappings with fallback images
allRoomTypes.forEach(roomType => {
  roomImageMappings[roomType] = {};
  allStyles.forEach(style => {
    roomImageMappings[roomType][style] = [fallbackImage, fallbackImage, fallbackImage];
  });
});

/**
 * Get a random room image for a specific room type and style
 */
export const getRoomImage = (roomType: RoomType, style: StyleType): any => {
  const images = roomImageMappings[roomType]?.[style];
  if (!images || images.length === 0) {
    return fallbackImage;
  }
  
  // Return a random image from the available options
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

/**
 * Get all images for a specific room type and style
 */
export const getAllRoomImages = (roomType: RoomType, style: StyleType): any[] => {
  return roomImageMappings[roomType]?.[style] || [fallbackImage];
};

/**
 * Get a default room image for room type selection (uses contemporary style as default)
 */
export const getDefaultRoomImage = (roomType: RoomType): any => {
  return getRoomImage(roomType, 'contemporary');
};

/**
 * Get all available room types
 */
export const getAllRoomTypes = (): RoomType[] => {
  return allRoomTypes;
};

/**
 * Get all available styles
 */
export const getAllStyles = (): StyleType[] => {
  return allStyles;
};

/**
 * Helper function to update room image mappings when user provides new images
 * This can be called to replace fallback images with actual room images
 */
export const updateRoomImage = (roomType: RoomType, style: StyleType, imageIndex: number, imageSource: any): void => {
  if (roomImageMappings[roomType] && roomImageMappings[roomType][style]) {
    roomImageMappings[roomType][style][imageIndex] = imageSource;
  }
};

/**
 * Helper function to get a human-readable room type name
 */
export const getRoomTypeDisplayName = (roomType: RoomType): string => {
  const displayNames: Record<RoomType, string> = {
    'bedroom': 'Bedroom',
    'living-room': 'Living Room',
    'kitchen': 'Kitchen',
    'outdoor-space': 'Outdoor Space',
    'baby-kids-room': 'Baby & Kids Room',
    'bathroom': 'Bathroom',
    'closet': 'Closet',
    'store': 'Store',
    'home-office': 'Home Office',
    'home-cinema': 'Home Cinema',
    'cafe-bar': 'Cafe & Bar',
    'garage': 'Garage',
    'hallway': 'Hallway',
    'dining-room': 'Dining Room',
    'gym': 'Gym',
    'laundry-room': 'Laundry Room',
    'reception-area': 'Reception Area',
    'office': 'Office',
  };
  return displayNames[roomType] || roomType;
};

/**
 * Helper function to get a human-readable style name
 */
export const getStyleDisplayName = (style: StyleType): string => {
  const displayNames: Record<StyleType, string> = {
    'contemporary': 'Contemporary',
    'classic': 'Classic',
    'transitional': 'Transitional',
    'mid-century-modern': 'Mid-Century Modern',
    'industrial': 'Industrial',
    'scandinavian': 'Scandinavian',
    'boho': 'Boho',
    'shabby-chic': 'Shabby Chic',
    'mediterranean': 'Mediterranean',
    'oriental': 'Oriental',
    'asian': 'Asian',
    'wabi-sabi': 'Wabi-Sabi',
    'retro': 'Retro',
    'eclectic': 'Eclectic',
    'rustic': 'Rustic',
    'farmhouse': 'Farmhouse',
    'memphis': 'Memphis',
    'craftsman': 'Craftsman',
    'victorian': 'Victorian',
    'coastal-beach': 'Coastal Beach',
    'southwestern': 'Southwestern',
    'seventies': '70\'s',
    'tropical': 'Tropical',
  };
  return displayNames[style] || style;
}; 