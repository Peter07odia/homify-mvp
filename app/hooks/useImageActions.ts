import { useState, useCallback } from 'react';
import { Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

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

  // Save image to photo library
  const saveImage = useCallback(async (imageUri: string) => {
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
      const fileUri = FileSystem.documentDirectory + 'room_comparison.jpg';
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      Alert.alert(
        'Success',
        'Image saved to your photo library!',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }]
      );

      console.log('Image saved successfully:', asset);

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

  // Share image
  const shareImage = useCallback(async (imageUri: string) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDownloadingImage(true);

      // Download the image to a local file first
      const fileUri = FileSystem.documentDirectory + 'room_comparison_share.jpg';
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image for sharing');
      }

      // Share the local file
      const shareResult = await Share.share({
        url: downloadResult.uri,
        message: 'Check out my room transformation created with Homify!',
      });

      if (shareResult.action === Share.sharedAction) {
        console.log('Image shared successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert(
        'Error',
        'Failed to share image. Please try again.'
      );
    } finally {
      setDownloadingImage(false);
    }
  }, []);

  return {
    downloadingImage,
    savingPermissionGranted,
    saveImage,
    shareImage,
    checkSavePermissions,
  };
}; 