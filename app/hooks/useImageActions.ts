import { useState, useCallback } from 'react';
import { Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import NotificationService from '../utils/notificationService';

export const useImageActions = () => {
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [savingPermissionGranted, setSavingPermissionGranted] = useState(false);

  // Check if we have permission to save to photo library
  const checkSavePermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';
      setSavingPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error checking media library permissions:', error);
      return false;
    }
  }, []);

  // Save image to photo library with notification
  const saveImage = useCallback(async (imageUri: string, imageType: 'empty' | 'styled' = 'styled') => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to save');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDownloadingImage(true);

      // Check permissions first
      const hasPermission = await checkSavePermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission needed',
          'We need permission to save images to your photo library'
        );
        return;
      }

      // Download the image to device storage first
      const fileUri = FileSystem.documentDirectory + `room_${imageType}_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      // Show success notification
      await NotificationService.showDownloadCompleteNotification(imageType);
      
      Alert.alert(
        'Success',
        'Image saved to your photo library!',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }]
      );

      console.log('Image saved successfully:', asset);

      return asset;

    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert(
        'Error',
        'Failed to save image. Please try again.'
      );
    } finally {
      setDownloadingImage(false);
    }
  }, [checkSavePermissions]);

  // Save image to My Photos section (app internal storage)
  const saveToMyPhotos = useCallback(async (
    originalUri: string, 
    emptyUri?: string, 
    styledUri?: string, 
    style?: string
  ) => {
    try {
      // This would typically save to a database or local storage
      // For now, we'll just log the action
      console.log('Saving to My Photos:', {
        originalUri,
        emptyUri,
        styledUri,
        style,
        timestamp: Date.now(),
      });

      // In a real app, you would:
      // 1. Save image URIs to AsyncStorage or SQLite
      // 2. Optionally copy images to app's document directory
      // 3. Update the saved photos state in the app

      // Show processing complete notification if style is provided
      if (style && styledUri) {
        await NotificationService.showProcessingCompleteNotification(style);
      }

      return true;
    } catch (error) {
      console.error('Error saving to My Photos:', error);
      return false;
    }
  }, []);

  // Share image
  const shareImage = useCallback(async (imageUri: string) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await Share.share({
        url: imageUri,
        message: 'Check out my styled room from Homify!',
      });

      if (result.action === Share.sharedAction) {
        console.log('Image shared successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  }, []);

  return {
    downloadingImage,
    savingPermissionGranted,
    saveImage,
    saveToMyPhotos,
    shareImage,
    checkSavePermissions,
  };
}; 