import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform, Linking } from 'react-native';

export interface PermissionStatus {
  camera: {
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  };
  mediaLibrary: {
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  };
  cameraRoll: {
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  };
}

export const checkAllPermissions = async (): Promise<PermissionStatus> => {
  console.log('🔍 Checking all permissions...');
  
  try {
    // Check camera permissions
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    console.log('📷 Camera permission:', cameraPermission);
    
    // Check media library permissions
    const mediaLibraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    console.log('📱 Media library permission:', mediaLibraryPermission);
    
    // Check camera roll permissions (alternative method)
    const cameraRollPermission = await MediaLibrary.getPermissionsAsync();
    console.log('🖼️ Camera roll permission:', cameraRollPermission);
    
    return {
      camera: {
        granted: cameraPermission.granted,
        canAskAgain: cameraPermission.canAskAgain,
        status: cameraPermission.status,
      },
      mediaLibrary: {
        granted: mediaLibraryPermission.granted,
        canAskAgain: mediaLibraryPermission.canAskAgain,
        status: mediaLibraryPermission.status,
      },
      cameraRoll: {
        granted: cameraRollPermission.granted,
        canAskAgain: cameraRollPermission.canAskAgain,
        status: cameraRollPermission.status,
      },
    };
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    throw error;
  }
};

export const requestAllPermissions = async (): Promise<PermissionStatus> => {
  console.log('🔐 Requesting all permissions...');
  
  try {
    // Request camera permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    console.log('📷 Camera permission requested:', cameraPermission);
    
    // Request media library permissions
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('📱 Media library permission requested:', mediaLibraryPermission);
    
    // Request camera roll permissions
    const cameraRollPermission = await MediaLibrary.requestPermissionsAsync();
    console.log('🖼️ Camera roll permission requested:', cameraRollPermission);
    
    return {
      camera: {
        granted: cameraPermission.granted,
        canAskAgain: cameraPermission.canAskAgain,
        status: cameraPermission.status,
      },
      mediaLibrary: {
        granted: mediaLibraryPermission.granted,
        canAskAgain: mediaLibraryPermission.canAskAgain,
        status: mediaLibraryPermission.status,
      },
      cameraRoll: {
        granted: cameraRollPermission.granted,
        canAskAgain: cameraRollPermission.canAskAgain,
        status: cameraRollPermission.status,
      },
    };
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    throw error;
  }
};

export const openDeviceSettings = () => {
  if (Platform.OS === 'ios') {
    Alert.alert(
      '⚙️ Open iPhone Settings',
      'To enable camera and photos permissions:\n\n1. Open Settings app\n2. Scroll down and tap "Homify"\n3. Turn ON Camera and Photos permissions\n4. Return to Homify and try again',
      [
        {
          text: 'Open Settings',
          onPress: () => Linking.openURL('app-settings:'),
        },
        { text: 'OK' },
      ]
    );
  } else if (Platform.OS === 'android') {
    Alert.alert(
      '⚙️ Open Android Settings',
      'To enable camera and photos permissions:\n\n1. Open Settings app\n2. Go to Apps & notifications\n3. Find and tap "Homify"\n4. Tap Permissions\n5. Enable Camera and Storage permissions\n6. Return to Homify and try again',
      [
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
        { text: 'OK' },
      ]
    );
  }
};

export const showPermissionStatus = (permissions: PermissionStatus) => {
  const issues = [];
  
  if (!permissions.camera.granted) {
    issues.push(`📷 Camera: ${permissions.camera.status}${!permissions.camera.canAskAgain ? ' (Denied permanently)' : ''}`);
  }
  
  if (!permissions.mediaLibrary.granted) {
    issues.push(`📱 Photo Library: ${permissions.mediaLibrary.status}${!permissions.mediaLibrary.canAskAgain ? ' (Denied permanently)' : ''}`);
  }
  
  if (!permissions.cameraRoll.granted) {
    issues.push(`🖼️ Media Library: ${permissions.cameraRoll.status}${!permissions.cameraRoll.canAskAgain ? ' (Denied permanently)' : ''}`);
  }
  
  if (issues.length > 0) {
    const hasPermissionsDeniedPermanently = !permissions.camera.canAskAgain || !permissions.mediaLibrary.canAskAgain;
    
    Alert.alert(
      '🔐 Permission Issues Detected',
      `The following permissions need attention:\n\n${issues.join('\n\n')}${hasPermissionsDeniedPermanently ? '\n\n⚠️ Some permissions were denied permanently. You need to enable them manually in device settings.' : ''}`,
      [
        ...(hasPermissionsDeniedPermanently ? [{
          text: '⚙️ Open Settings',
          onPress: openDeviceSettings,
          style: 'default' as const,
        }] : []),
        { text: 'OK' },
      ]
    );
  } else {
    Alert.alert(
      '✅ All Permissions Granted', 
      'Camera and gallery access should work properly now!\n\nTry taking a photo or selecting from gallery.',
      [{ text: 'Perfect!' }]
    );
  }
};

// Enhanced permission testing for real devices
export const testRealDevicePermissions = async () => {
  console.log('🔧 Testing real device permissions...');
  
  try {
    // Step 1: Check current permission status
    console.log('Step 1: Checking current permissions...');
    const currentPermissions = await checkAllPermissions();
    
    // Step 2: If permissions are missing, request them
    if (!currentPermissions.camera.granted || !currentPermissions.mediaLibrary.granted) {
      console.log('Step 2: Some permissions missing, requesting...');
      
      Alert.alert(
        '🔐 Permissions Needed',
        'Homify needs camera and photo library permissions to work properly. Please allow these permissions in the next prompts.',
        [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                const newPermissions = await requestAllPermissions();
                showPermissionStatus(newPermissions);
              } catch (error) {
                console.error('Error requesting permissions:', error);
                Alert.alert('Error', `Failed to request permissions: ${error.message}`);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      console.log('Step 2: All permissions already granted!');
      showPermissionStatus(currentPermissions);
    }
    
  } catch (error) {
    console.error('❌ Real device permission test failed:', error);
    Alert.alert('Permission Test Failed', `Error: ${error.message}\n\nTry restarting the app or check device settings manually.`);
  }
};

export const debugPermissions = async () => {
  try {
    console.log('🚀 Starting permission debug...');
    
    // Check if running on simulator
    const isSimulator = Platform.OS === 'ios' && __DEV__;
    
    if (isSimulator) {
      Alert.alert(
        '🍎 iOS Simulator Detected',
        'Camera functionality is limited in the iOS Simulator. For complete testing:\n\n• Gallery permissions can be tested\n• Camera requires a physical device\n\nUse a real device for full camera testing.',
        [
          {
            text: 'Test Gallery Only',
            onPress: async () => {
              try {
                const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (result.granted) {
                  Alert.alert('✅ Gallery Permission', 'Gallery access should work in simulator!');
                } else {
                  Alert.alert('❌ Gallery Permission', `Gallery permission status: ${result.status}`);
                }
              } catch (error) {
                Alert.alert('Error', `Gallery permission test failed: ${error.message}`);
              }
            }
          },
          { text: 'OK' }
        ]
      );
      return;
    }
    
    // For real devices, run comprehensive test
    await testRealDevicePermissions();
    
  } catch (error) {
    console.error('💥 Permission debug failed:', error);
    Alert.alert('Debug Failed', `Error: ${error.message}`);
  }
};

export const resetPermissionState = async (): Promise<void> => {
  console.log('🔄 Resetting permission state...');
  
  try {
    // Try to clear any cached permission state
    if (Platform.OS === 'ios') {
      // On iOS, we can't programmatically reset permissions
      // but we can force a fresh request
      Alert.alert(
        '🔄 Permission Reset Required',
        'To fix gallery access issues in Expo Go:\n\n1. Close the Expo Go app completely\n2. Go to iOS Settings → Privacy & Security → Photos\n3. Find "Expo Go" and change the setting\n4. Change it back to "All Photos"\n5. Restart Expo Go\n\nThis will reset the permission cache.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
          { text: 'Later' }
        ]
      );
    } else {
      // Android - clear permission cache by requesting again
      Alert.alert(
        '🔄 Permission Reset Required',
        'To fix gallery access issues in Expo Go:\n\n1. Close the Expo Go app completely\n2. Go to Android Settings → Apps → Expo Go → Permissions\n3. Turn OFF Camera and Storage permissions\n4. Turn them back ON\n5. Restart Expo Go\n\nThis will reset the permission cache.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
          { text: 'Later' }
        ]
      );
    }
  } catch (error) {
    console.error('❌ Error in permission reset:', error);
  }
};

export const forcePermissionRefresh = async (): Promise<boolean> => {
  console.log('🔄 Force refreshing permissions...');
  
  try {
    // Request permissions multiple times to clear any cache
    console.log('1. Requesting camera permissions...');
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    
    console.log('2. Requesting media library permissions...');
    const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    console.log('3. Requesting MediaLibrary permissions...');
    const mediaLibResult = await MediaLibrary.requestPermissionsAsync();
    
    console.log('Permission refresh results:', {
      camera: cameraResult.status,
      media: mediaResult.status,
      mediaLib: mediaLibResult.status
    });
    
    const allGranted = cameraResult.granted && mediaResult.granted && mediaLibResult.granted;
    
    if (!allGranted) {
      Alert.alert(
        '⚠️ Permissions Still Issues',
        'Some permissions are still not working properly. You may need to:\n\n1. Completely close Expo Go\n2. Delete and reinstall Expo Go app\n3. Grant all permissions when prompted\n\nThis is a known issue with Expo Go permission caching.',
        [
          { text: 'I understand' }
        ]
      );
    }
    
    return allGranted;
  } catch (error) {
    console.error('❌ Error in force permission refresh:', error);
    return false;
  }
};

export const testGalleryWithFallback = async (): Promise<{ success: boolean; uri?: string; error?: string }> => {
  console.log('🧪 Testing gallery with fallback...');
  
  try {
    // First try standard permissions
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      return {
        success: false,
        error: `Permission denied: ${permission.status}. CanAskAgain: ${permission.canAskAgain}`
      };
    }
    
    // Try simple picker first
    console.log('Trying basic image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    
    if (result.canceled) {
      return { success: false, error: 'User canceled' };
    }
    
    if (!result.assets || result.assets.length === 0) {
      return { success: false, error: 'No image selected' };
    }
    
    return {
      success: true,
      uri: result.assets[0].uri
    };
    
  } catch (error) {
    console.error('Gallery test error:', error);
    
    // If we get specific errors, provide targeted solutions
    if (error.message.includes('User denied permissions')) {
      return {
        success: false,
        error: 'Permission denied - need to reset in device settings'
      };
    }
    
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}; 