import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import { debugPermissions } from '../utils/permissionDebugger';
import * as Camera from 'expo-camera';
import Constants from 'expo-constants';

type PhotoSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoSelection'>;
type PhotoSelectionRouteProp = RouteProp<RootStackParamList, 'PhotoSelection'>;

const { width } = Dimensions.get('window');

const PhotoSelectionScreen = () => {
  const navigation = useNavigation<PhotoSelectionNavigationProp>();
  const route = useRoute<PhotoSelectionRouteProp>();
  const { returnToPreview, activeJobId, mode } = route.params || {};

  // Local state
  const [showActiveJobBanner, setShowActiveJobBanner] = useState(false);

  // Swipe gesture handling
  const pan = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100; // Minimum distance for swipe
  const velocityThreshold = 0.3; // Minimum velocity for swipe

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        pan.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update animation value
        pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // No need to flattenOffset since we're not using setOffset
        
        const { dx, vx } = gestureState;
        
        // Determine swipe direction and navigate
        if (Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold) {
          if (dx > 0) {
            // Swipe right - go back to onboarding or previous screen
            handleSwipeBack();
          } else {
            // Swipe left - go forward to camera
            handleSwipeForward();
          }
        }
        
        // Reset animation
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleSwipeBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Handle debug permissions
  const handleDebugPermissions = useCallback(async () => {
    try {
      await debugPermissions();
    } catch (error) {
      console.error('[PhotoSelectionScreen] Debug permissions error:', error);
    }
  }, []);

  // Handle navigate to camera debug
  const handleCameraDebug = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CameraDebug' as never);
  }, [navigation]);

  // Handle gallery press
  const handleGalleryPress = useCallback(async () => {
    try {
      console.log('[PhotoSelectionScreen] 🖼️ Starting gallery selection...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Request media library permissions
      console.log('[PhotoSelectionScreen] 🔐 Requesting media library permissions...');
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[PhotoSelectionScreen] 🔐 Permission result:', libraryPermission);
      
      if (!libraryPermission.granted) {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return;
      }

      // Launch image picker with simplified, reliable settings
      console.log('[PhotoSelectionScreen] 📱 Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('[PhotoSelectionScreen] 📱 Image picker result:', {
        canceled: result.canceled,
        hasAssets: result.assets ? result.assets.length : 0,
        firstAsset: result.assets && result.assets[0] ? {
          uri: result.assets[0].uri?.substring(0, 50) + '...',
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type
        } : null
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('[PhotoSelectionScreen] ✅ Gallery image selected successfully');
        console.log('[PhotoSelectionScreen] 🎯 Navigating to EditCanvas with mode:', mode);
        
        // Navigate based on mode
        if (mode === 'style') {
          console.log('[PhotoSelectionScreen] 📍 Navigating for style mode');
          navigation.navigate('EditCanvas', { 
            imageUri,
            source: 'gallery'
          });
        } else {
          console.log('[PhotoSelectionScreen] 📍 Navigating for empty mode');
          navigation.navigate('EditCanvas', { 
            imageUri,
            source: 'gallery', // Changed from 'camera' to 'gallery' for consistency
            mode: 'empty'
          });
        }
      } else {
        console.log('[PhotoSelectionScreen] ❌ Gallery selection was canceled or no image selected');
        if (result.canceled) {
          console.log('[PhotoSelectionScreen] ℹ️ User canceled the picker');
        } else {
          console.log('[PhotoSelectionScreen] ❓ Unknown issue with picker result');
        }
      }
    } catch (error) {
      console.error('[PhotoSelectionScreen] 💥 Gallery error:', error);
      Alert.alert('Error', `Failed to open photo library: ${error.message}`);
    }
  }, [navigation, mode]);

  // Handle camera press with enhanced environment detection
  const handleCameraPress = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Improved environment detection
      const isExpoGoApp = Constants.executionEnvironment === 'bare' ? false : Constants.appOwnership === 'expo';
      const isSimulator = !Constants.isDevice;
      
      console.log('📸 Environment check:', {
        executionEnvironment: Constants.executionEnvironment,
        appOwnership: Constants.appOwnership,
        isDevice: Constants.isDevice,
        isExpoGo: isExpoGoApp,
        isSimulator
      });
      
      // Handle simulator with better options
      if (isSimulator) {
        console.log('🍎 Simulator detected - providing camera alternatives');
        
        Alert.alert(
          '📱 Camera in Simulator',
          'Camera is not available in the simulator. Choose an alternative:',
          [
            {
              text: 'Use Test Image',
              onPress: () => {
                console.log('🧪 Using test image for simulator');
                // Navigate with a placeholder image for testing
                navigation.navigate('EditCanvas', { 
                  imageUri: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600',
                  source: 'camera',
                  mode: 'empty'
                });
              }
            },
            {
              text: 'Open Gallery',
              onPress: handleGalleryPress
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      // For now, just navigate to camera screen - remove hardware check
      console.log('[PhotoSelectionScreen] Navigating to camera');
      if (mode === 'style') {
        navigation.navigate('Camera', { 
          returnToPreview: false,
          activeJobId: undefined
        });
      } else {
        navigation.navigate('Camera', { 
          returnToPreview: false,
          activeJobId: undefined
        });
      }
    } catch (error) {
      console.error('[PhotoSelectionScreen] Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  }, [navigation, handleGalleryPress]);

  // Handle return to preview if there's an active job
  const handleReturnToPreview = useCallback(() => {
    // Since we removed global state, just navigate to preview
    // In a real app, you might want to store the last processed image URI somewhere
    console.log('[PhotoSelectionScreen] Return to preview requested');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // For now, just hide the banner since we can't return without image context
    setShowActiveJobBanner(false);
  }, []);

  // Check for active jobs on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[PhotoSelectionScreen] Screen focused');
      // Since we removed global state, just hide any existing banner
      setShowActiveJobBanner(false);
    }, [])
  );

  useEffect(() => {
    console.log('[PhotoSelectionScreen] Mounted with params:', { returnToPreview, activeJobId });
  }, [returnToPreview, activeJobId]);

  const handleSwipeForward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if there's an active job - if so, return to preview
    if (showActiveJobBanner) {
      handleReturnToPreview();
    } else {
      // No active job, open camera
      handleCameraPress();
    }
  }, [handleReturnToPreview, handleCameraPress, showActiveJobBanner]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{
            translateX: pan.interpolate({
              inputRange: [-width, 0, width],
              outputRange: [-50, 0, 50],
              extrapolate: 'clamp',
            })
          }]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaView style={styles.innerContainer}>
        <StatusBar style="dark" />
        
        {/* Active Job Banner */}
        {showActiveJobBanner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>You have an image being processed</Text>
            <TouchableOpacity onPress={handleReturnToPreview}>
              <Text style={styles.bannerAction}>Return to Preview</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Photo Source</Text>
          <Text style={styles.headerSubtitle}>
            Take a photo or upload an image to redesign your space with AI
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Camera Debug Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF6B6B', marginBottom: 16 }]}
            onPress={handleCameraDebug}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="bug-report" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Camera Debug</Text>
              <Text style={styles.actionButtonSubtext}>
                Test camera permissions and functionality
              </Text>
            </View>
          </TouchableOpacity>

          {/* Simple Gallery Test Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50', marginBottom: 16 }]}
            onPress={async () => {
              try {
                console.log('🧪 [TestButton] Testing image picker...');
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsEditing: false,
                  quality: 0.3, // Lower quality for faster testing
                });
                console.log('🧪 [TestButton] Result:', result);
                if (!result.canceled && result.assets?.[0]) {
                  Alert.alert('Success!', `Image selected: ${result.assets[0].uri.substring(0, 50)}...`);
                } else {
                  Alert.alert('Canceled', 'Image selection was canceled');
                }
              } catch (error) {
                console.error('🧪 [TestButton] Error:', error);
                Alert.alert('Error', error.message);
              }
            }}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="science" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Test Gallery Picker</Text>
              <Text style={styles.actionButtonSubtext}>
                Simple test without navigation
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCameraPress}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Take Photo</Text>
              <Text style={styles.actionButtonSubtext}>
                Use your camera to capture a room
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={handleGalleryPress}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.iconContainer, styles.secondaryIconContainer]}>
                <FontAwesome6 name="images" size={28} color="#7C5C3E" />
              </View>
              <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
                Choose from Gallery
              </Text>
              <Text style={[styles.actionButtonSubtext, styles.secondaryActionButtonSubtext]}>
                Select an existing photo from your library
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  innerContainer: {
    flex: 1,
  },
  activeJobBanner: {
    margin: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#7C5C3E',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 5,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C5C3E',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A68B6B',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    backgroundColor: '#7C5C3E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  secondaryActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0D5C9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 4,
  },
  secondaryActionButtonSubtext: {
    fontSize: 14,
    color: '#A68B6B',
    textAlign: 'center',
  },
  secondaryIconContainer: {
    backgroundColor: '#E0D5C9',
    borderRadius: 12,
    padding: 4,
  },
  banner: {
    backgroundColor: '#7C5C3E',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  bannerAction: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default PhotoSelectionScreen; 