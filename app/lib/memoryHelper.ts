import * as FileSystem from 'expo-file-system';
import { Image, Platform } from 'react-native';

/**
 * Clear temporary image cache to free up memory
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    // Clear the cache directory
    const cacheFiles = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory || '');
    const imageFiles = cacheFiles.filter(file => 
      file.endsWith('.jpg') || 
      file.endsWith('.jpeg') || 
      file.endsWith('.png')
    );
    
    console.log(`Cleaning ${imageFiles.length} cached image files`);
    
    for (const file of imageFiles) {
      try {
        await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${file}`);
      } catch (err) {
        console.warn(`Failed to delete cached image: ${file}`, err);
      }
    }
  } catch (error) {
    console.warn('Error clearing image cache:', error);
  }
};

/**
 * Log details about an image file for debugging
 */
export const logImageDetails = async (
  imageUri: string, 
  source: string
): Promise<void> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    console.log(`[${source}] Image file info:`, JSON.stringify(fileInfo));
    
    // Try to get image dimensions
    await new Promise<void>((resolve) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          console.log(`[${source}] Image dimensions: ${width}x${height}`);
          resolve();
        },
        (error) => {
          console.warn(`[${source}] Failed to get image size:`, error);
          resolve();
        }
      );
    });
  } catch (error) {
    console.warn(`[${source}] Error logging image details:`, error);
  }
};

/**
 * Perform iOS-specific memory cleanup
 */
export const performIOSMemoryCleanup = (): void => {
  if (Platform.OS !== 'ios') return;
  
  // In a real app, this would contain iOS-specific memory cleanup
  // This is a placeholder for demonstration
  console.log('Performing iOS memory cleanup');
  
  // Potential iOS cleanup tasks:
  // - Release image cache
  // - Clear NSURLCache
  // - Trigger garbage collection hints
};

/**
 * Debug helper for image processing pipeline
 */
export const debugImageProcessingPipeline = async (
  imageUri: string
): Promise<void> => {
  try {
    console.log('Debugging image processing pipeline');
    await logImageDetails(imageUri, 'debugImageProcessingPipeline');
    
    // Check how much space is available in cache directory
    const cacheInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory || '');
    console.log('Cache directory info:', JSON.stringify(cacheInfo));
    
    // Log available memory if possible
    console.log('Memory cleanup complete');
  } catch (error) {
    console.warn('Error during debug routine:', error);
  }
}; 