import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

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

export const showPermissionStatus = (permissions: PermissionStatus) => {
  const messages = [];
  
  if (!permissions.camera.granted) {
    messages.push(`Camera: ${permissions.camera.status} (Can ask again: ${permissions.camera.canAskAgain})`);
  }
  
  if (!permissions.mediaLibrary.granted) {
    messages.push(`Media Library: ${permissions.mediaLibrary.status} (Can ask again: ${permissions.mediaLibrary.canAskAgain})`);
  }
  
  if (!permissions.cameraRoll.granted) {
    messages.push(`Camera Roll: ${permissions.cameraRoll.status} (Can ask again: ${permissions.cameraRoll.canAskAgain})`);
  }
  
  if (messages.length > 0) {
    Alert.alert(
      'Permission Issues Detected',
      `The following permissions are not granted:\n\n${messages.join('\n\n')}`,
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              // On iOS, we can't directly open settings, but we can show instructions
              Alert.alert(
                'Open Settings',
                'Please go to Settings > Privacy & Security > Camera/Photos and enable permissions for Homify',
                [{ text: 'OK' }]
              );
            }
          },
        },
        { text: 'OK' },
      ]
    );
  } else {
    Alert.alert('All Permissions Granted', 'Camera and gallery access should work properly.');
  }
};

export const debugPermissions = async () => {
  try {
    console.log('🚀 Starting permission debug...');
    
    // Check if running on simulator
    const isSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTVOS === false;
    
    if (isSimulator) {
      Alert.alert(
        'iOS Simulator Detected',
        'Camera functionality is not available in the iOS Simulator. Gallery permissions can still be tested.\n\nFor full camera testing, please use a physical device.',
        [{ text: 'OK' }]
      );
    }
    
    // First check current status
    const currentPermissions = await checkAllPermissions();
    console.log('📊 Current permissions:', currentPermissions);
    
    // If any permission is missing, request them
    const hasAllPermissions = currentPermissions.camera.granted && 
                             currentPermissions.mediaLibrary.granted && 
                             currentPermissions.cameraRoll.granted;
    
    if (!hasAllPermissions) {
      console.log('⚠️ Some permissions missing, requesting...');
      const newPermissions = await requestAllPermissions();
      showPermissionStatus(newPermissions);
      return newPermissions;
    } else {
      console.log('✅ All permissions already granted');
      showPermissionStatus(currentPermissions);
      return currentPermissions;
    }
  } catch (error) {
    console.error('💥 Permission debug failed:', error);
    Alert.alert('Permission Error', `Failed to check permissions: ${error.message}`);
    throw error;
  }
}; 