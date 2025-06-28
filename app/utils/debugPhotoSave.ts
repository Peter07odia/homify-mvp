// Debug utility to test photo saving functionality
// This can be called from anywhere in the app to test photo library saving

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export class PhotoSaveDebugger {
  
  static async testPhotoSaving(): Promise<void> {
    console.log('🧪 [PhotoSaveDebugger] === TESTING PHOTO SAVE FUNCTIONALITY ===');
    
    try {
      // Step 1: Check permissions
      console.log('📱 [PhotoSaveDebugger] Step 1: Checking photo library permissions...');
      const permissionResult = await MediaLibrary.requestPermissionsAsync();
      console.log('📱 [PhotoSaveDebugger] Permission result:', permissionResult);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          '❌ Permission Denied', 
          `Photo library access: ${permissionResult.status}\n\nPlease go to:\niOS Settings → Privacy & Security → Photos → Expo Go → All Photos`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Step 2: Test image download and save
      console.log('📱 [PhotoSaveDebugger] Step 2: Testing image download and save...');
      
      // Use a test image from Picsum (public, reliable)
      const testImageUrl = 'https://picsum.photos/800/600';
      const localUri = `${FileSystem.documentDirectory}test_homify_${Date.now()}.jpg`;
      
      console.log('📱 [PhotoSaveDebugger] Downloading test image...');
      console.log('📱 [PhotoSaveDebugger] URL:', testImageUrl);
      console.log('📱 [PhotoSaveDebugger] Local path:', localUri);
      
      const downloadResult = await FileSystem.downloadAsync(testImageUrl, localUri);
      console.log('📱 [PhotoSaveDebugger] Download result:', downloadResult);
      
      if (downloadResult.status === 200) {
        console.log('📱 [PhotoSaveDebugger] Download successful! Saving to photo library...');
        
        const asset = await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        console.log('📱 [PhotoSaveDebugger] Photo saved successfully!', {
          assetId: asset.id,
          filename: asset.filename,
          mediaType: asset.mediaType,
          width: asset.width,
          height: asset.height
        });
        
        Alert.alert(
          '✅ Test Successful!', 
          `Photo saved to library!\n\nAsset ID: ${asset.id}\nFilename: ${asset.filename}\n\nCheck your Photos app!`,
          [{ text: 'Great!' }]
        );
        
        console.log('✅✅✅ [PhotoSaveDebugger] TEST COMPLETED SUCCESSFULLY! ✅✅✅');
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('❌❌❌ [PhotoSaveDebugger] TEST FAILED:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      Alert.alert(
        '❌ Test Failed',
        `Error: ${error.message}\n\nCheck console logs for details.`,
        [{ text: 'OK' }]
      );
    }
  }

  static async checkPhotoLibraryPermissions(): Promise<MediaLibrary.PermissionResponse> {
    console.log('📱 [PhotoSaveDebugger] Checking photo library permissions...');
    const result = await MediaLibrary.getPermissionsAsync();
    console.log('📱 [PhotoSaveDebugger] Current permissions:', result);
    return result;
  }

  static async requestPhotoLibraryPermissions(): Promise<MediaLibrary.PermissionResponse> {
    console.log('📱 [PhotoSaveDebugger] Requesting photo library permissions...');
    const result = await MediaLibrary.requestPermissionsAsync();
    console.log('📱 [PhotoSaveDebugger] Permission request result:', result);
    return result;
  }
}

export default PhotoSaveDebugger; 