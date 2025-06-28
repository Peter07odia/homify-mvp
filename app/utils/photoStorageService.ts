import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedPhoto {
  id: string;
  originalUrl: string;
  emptyUrl?: string;
  styledUrl?: string;
  style?: string;
  roomType?: string;
  createdAt: string;
  status: 'processing' | 'completed' | 'failed';
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    jobId?: string;
    workflowId?: string;
  };
}

class PhotoStorageService {
  private static instance: PhotoStorageService;
  private readonly STORAGE_KEY = '@homify_saved_photos';
  private photos: SavedPhoto[] = [];

  static getInstance(): PhotoStorageService {
    if (!PhotoStorageService.instance) {
      PhotoStorageService.instance = new PhotoStorageService();
    }
    return PhotoStorageService.instance;
  }

  async loadPhotos(): Promise<SavedPhoto[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.photos = JSON.parse(stored);
      }
      return this.photos;
    } catch (error) {
      console.error('Error loading photos:', error);
      return [];
    }
  }

  async savePhoto(photo: Omit<SavedPhoto, 'id' | 'createdAt'>): Promise<SavedPhoto> {
    try {
      const newPhoto: SavedPhoto = {
        ...photo,
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      this.photos.unshift(newPhoto); // Add to beginning
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
      
      console.log('Photo saved to storage:', newPhoto.id);
      return newPhoto;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  async updatePhoto(id: string, updates: Partial<SavedPhoto>): Promise<SavedPhoto | null>;
  async updatePhoto(photo: SavedPhoto): Promise<SavedPhoto | null>;
  async updatePhoto(idOrPhoto: string | SavedPhoto, updates?: Partial<SavedPhoto>): Promise<SavedPhoto | null> {
    try {
      let id: string;
      let actualUpdates: Partial<SavedPhoto>;

      if (typeof idOrPhoto === 'string') {
        id = idOrPhoto;
        actualUpdates = updates!;
      } else {
        id = idOrPhoto.id;
        actualUpdates = idOrPhoto;
      }

      const index = this.photos.findIndex(photo => photo.id === id);
      if (index === -1) {
        console.warn('Photo not found for update:', id);
        return null;
      }

      this.photos[index] = { ...this.photos[index], ...actualUpdates };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
      
      console.log('Photo updated:', id);
      return this.photos[index];
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }

  async deletePhoto(id: string): Promise<boolean> {
    try {
      const index = this.photos.findIndex(photo => photo.id === id);
      if (index === -1) {
        console.warn('Photo not found for deletion:', id);
        return false;
      }

      this.photos.splice(index, 1);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
      
      console.log('Photo deleted:', id);
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  getPhotos(): SavedPhoto[] {
    return [...this.photos]; // Return copy
  }

  getPhotoById(id: string): SavedPhoto | null {
    return this.photos.find(photo => photo.id === id) || null;
  }

  getPhotosByStatus(status: SavedPhoto['status']): SavedPhoto[] {
    return this.photos.filter(photo => photo.status === status);
  }

  getPhotosByRoomType(roomType: string): SavedPhoto[] {
    return this.photos.filter(photo => photo.roomType === roomType);
  }

  getRecentPhotos(limit: number = 10): SavedPhoto[] {
    return this.photos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async clearAllPhotos(): Promise<void> {
    try {
      this.photos = [];
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All photos cleared');
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }

  getPhotoCount(): number {
    return this.photos.length;
  }

  getCompletedPhotoCount(): number {
    return this.photos.filter(photo => photo.status === 'completed').length;
  }

  // Helper method to create a photo entry when user starts room creation (empty room)
  async createRoomPhoto(
    originalUrl: string, 
    roomType: string
  ): Promise<SavedPhoto> {
    return this.savePhoto({
      originalUrl,
      roomType,
      status: 'processing',
    });
  }

  // Helper method to create a photo entry when user starts upstyling
  async createUpstylePhoto(
    originalUrl: string, 
    roomType?: string,
    targetStyle?: string
  ): Promise<SavedPhoto> {
    return this.savePhoto({
      originalUrl,
      roomType,
      style: targetStyle,
      status: 'processing',
    });
  }

  // Helper method to update photo when room emptying completes
  async completeRoomEmptying(
    id: string,
    emptyUrl: string
  ): Promise<SavedPhoto | null> {
    return this.updatePhoto(id, {
      emptyUrl,
      status: 'completed',
    });
  }

  // Helper method to update photo when upstyling completes
  async completeUpstyling(
    id: string,
    styledUrl: string,
    style: string
  ): Promise<SavedPhoto | null> {
    console.log('📸 [PhotoStorageService] Completing upstyling:', { id, styledUrl, style });
    
    const updatedPhoto = await this.updatePhoto(id, {
      styledUrl,
      style,
      status: 'completed',
    });
    
    // Photo updated in storage only (auto-save to photo library removed)
    if (updatedPhoto) {
      console.log('💾 [PhotoStorageService] Photo updated in storage only');
    }
    
    return updatedPhoto;
  }

  // Helper method to save processed image immediately when found
  async saveProcessedImage(
    originalUrl: string,
    processedUrl: string,
    style: string = 'Contemporary',
    roomType: string = 'living-room'
  ): Promise<SavedPhoto> {
    console.log('💾 [PhotoStorageService] Saving processed image:', { 
      originalUrl: originalUrl.substring(0, 50) + '...', 
      processedUrl: processedUrl.substring(0, 50) + '...',
      style, 
      roomType 
    });
    
    const savedPhoto = await this.savePhoto({
      originalUrl,
      styledUrl: processedUrl,
      style,
      roomType,
      status: 'completed'
    });
    
    // Photo saved to storage only (auto-save to photo library removed)
    console.log('💾 [PhotoStorageService] Photo saved to storage only');
    
    return savedPhoto;
  }

  // Helper method to mark photo as failed
  async markPhotoAsFailed(id: string): Promise<SavedPhoto | null> {
    return this.updatePhoto(id, {
      status: 'failed',
    });
  }

  // Clear any demo or test data on app start
  async clearDemoData(): Promise<void> {
    try {
      const photos = await this.loadPhotos();
      const demoPhotos = photos.filter(photo => 
        photo.originalUrl.includes('placeholder') || 
        photo.originalUrl.includes('demo') ||
        photo.id.includes('demo')
      );
      
      if (demoPhotos.length > 0) {
        console.log(`Clearing ${demoPhotos.length} demo photos`);
        this.photos = photos.filter(photo => 
          !photo.originalUrl.includes('placeholder') && 
          !photo.originalUrl.includes('demo') &&
          !photo.id.includes('demo')
        );
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.photos));
      }
    } catch (error) {
      console.error('Error clearing demo data:', error);
    }
  }

  // Automatically save processed images to device photo library
  private async autoSaveToPhotoLibrary(photo: SavedPhoto): Promise<void> {
    try {
      console.log('🚀 [PhotoStorageService] === STARTING AUTO-SAVE TO PHOTO LIBRARY ===');
      console.log('📱 [PhotoStorageService] Photo details:', {
        id: photo.id,
        hasStyledUrl: !!photo.styledUrl,
        hasEmptyUrl: !!photo.emptyUrl,
        hasOriginalUrl: !!photo.originalUrl,
        styledUrl: photo.styledUrl?.substring(0, 100) + '...',
        emptyUrl: photo.emptyUrl?.substring(0, 100) + '...',
        originalUrl: photo.originalUrl?.substring(0, 100) + '...'
      });
      
      // Import MediaLibrary and Notifications dynamically
      console.log('📱 [PhotoStorageService] Importing expo-media-library...');
      const { saveToLibraryAsync, requestPermissionsAsync } = await import('expo-media-library');
      const NotificationService = (await import('./notificationService')).default;
      
      // Request permissions
      console.log('📱 [PhotoStorageService] Requesting photo library permissions...');
      const permissionResult = await requestPermissionsAsync();
      console.log('📱 [PhotoStorageService] Permission result:', permissionResult);
      
      if (permissionResult.status !== 'granted') {
        console.error('❌ [PhotoStorageService] Photo library permission DENIED:', permissionResult.status);
        console.error('   📱 Please check: iOS Settings → Privacy & Security → Photos → Expo Go → All Photos');
        return;
      }

      // Determine which image to save (prefer styled, then empty, then original)
      const imageUrl = photo.styledUrl || photo.emptyUrl || photo.originalUrl;
      const imageType = photo.styledUrl ? 'styled' : photo.emptyUrl ? 'empty' : 'original';
      
      if (!imageUrl) {
        console.warn('❌ No image URL found to save');
        return;
      }

      console.log(`📱 [PhotoStorageService] Auto-saving ${imageType} image to photo library...`);
      console.log(`📱 [PhotoStorageService] Full image URL:`, imageUrl);

      // Download and save image
      console.log('📱 [PhotoStorageService] Importing file system modules...');
      const { downloadAsync } = await import('expo-file-system');
      const { documentDirectory } = await import('expo-file-system');
      
      // Download the image to local storage first
      const localUri = `${documentDirectory}homify_${photo.id}_${imageType}_${Date.now()}.jpg`;
      console.log(`📱 [PhotoStorageService] Step 1: Downloading image to local storage...`);
      console.log(`📱 [PhotoStorageService] Local URI:`, localUri);
      
      const downloadResult = await downloadAsync(imageUrl, localUri);
      console.log(`📱 [PhotoStorageService] Download result:`, {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers
      });
      
      if (downloadResult.status === 200) {
        console.log(`📱 [PhotoStorageService] Step 2: Download successful! Saving to photo library...`);
        
        // Save to photo library
        const asset = await saveToLibraryAsync(downloadResult.uri);
        
        if (asset && asset.id) {
          console.log(`📱 [PhotoStorageService] Step 3: Photo library save result:`, {
            assetId: asset.id,
            filename: asset.filename,
            mediaType: asset.mediaType,
            width: asset.width,
            height: asset.height
          });
        } else {
          console.warn('⚠️ [PhotoStorageService] saveToLibraryAsync returned null - this is normal in Expo Go development');
          console.log('📱 [PhotoStorageService] Image was downloaded successfully but not saved to photo library (development limitation)');
        }
        
        // Show success notification immediately 
        console.log(`📱 [PhotoStorageService] Step 4: Showing success notifications...`);
        await NotificationService.showProcessingCompleteNotification(photo.style || 'Contemporary');
        
        // Also show download complete notification
        await NotificationService.showDownloadCompleteNotification(imageType as 'empty' | 'styled');
        
        if (asset && asset.id) {
          console.log(`✅✅✅ [PhotoStorageService] Successfully saved ${imageType} image to photo library! Asset ID: ${asset.id}`);
        } else {
          console.log(`✅✅✅ [PhotoStorageService] Image processed and downloaded successfully (photo library save skipped in development)`);
        }
      } else {
        console.error('❌ Failed to download image for saving');
        console.error('Download status:', downloadResult.status);
        console.error('Download headers:', downloadResult.headers);
      }
    } catch (error) {
      console.error('❌❌❌ [PhotoStorageService] CRITICAL ERROR auto-saving to photo library:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('❌❌❌ END ERROR DETAILS ❌❌❌');
      // Don't throw error - this is a background operation
    }
  }

  // Manual save to photo library (for user-initiated downloads)
  async saveToPhotoLibrary(photo: SavedPhoto, imageType: 'original' | 'empty' | 'styled' = 'styled'): Promise<boolean> {
    try {
      const { saveToLibraryAsync, requestPermissionsAsync } = await import('expo-media-library');
      const NotificationService = (await import('./notificationService')).default;
      
      // Request permissions
      const { status } = await requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Photo library permission is required to save images');
      }

      // Get the appropriate image URL
      let imageUrl: string | undefined;
      switch (imageType) {
        case 'styled':
          imageUrl = photo.styledUrl;
          break;
        case 'empty':
          imageUrl = photo.emptyUrl;
          break;
        case 'original':
          imageUrl = photo.originalUrl;
          break;
      }
      
      if (!imageUrl) {
        throw new Error(`No ${imageType} image available to save`);
      }

      console.log(`📱 Manually saving ${imageType} image to photo library:`, imageUrl);

      // Download and save image
      const { downloadAsync } = await import('expo-file-system');
      const { documentDirectory } = await import('expo-file-system');
      
      const localUri = `${documentDirectory}homify_${photo.id}_${imageType}_manual.jpg`;
      const downloadResult = await downloadAsync(imageUrl, localUri);
      
      if (downloadResult.status === 200) {
        const asset = await saveToLibraryAsync(downloadResult.uri);
        await NotificationService.showDownloadCompleteNotification(imageType as 'empty' | 'styled');
        
        if (asset && asset.id) {
          console.log(`✅ Successfully saved ${imageType} image to photo library`);
        } else {
          console.log(`✅ Image downloaded successfully (photo library save skipped in development)`);
        }
        return true;
      } else {
        throw new Error('Failed to download image');
      }
    } catch (error) {
      console.error('Error saving to photo library:', error);
      throw error;
    }
  }
}

export default PhotoStorageService.getInstance(); 