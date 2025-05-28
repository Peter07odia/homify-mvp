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
        pan.setOffset(pan._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update animation value
        pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
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

  // Handle camera press
  const handleCameraPress = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check if running on simulator
      const isSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTVOS === false;
      
      if (isSimulator) {
        Alert.alert(
          'Simulator Limitation', 
          'Camera is not available in the iOS Simulator. Please test on a physical device or use "Choose from Gallery" instead.',
          [
            { text: 'Use Gallery', onPress: handleGalleryPress },
            { text: 'OK' }
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

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('[PhotoSelectionScreen] Camera image captured:', imageUri);
        
        // Navigate based on mode
        if (mode === 'style') {
          navigation.navigate('EditCanvas', { 
            imageUri,
            source: 'camera'
          });
        } else {
          navigation.navigate('Preview', { 
            imageUri,
            mode: 'empty'
          });
        }
      }
    } catch (error) {
      console.error('[PhotoSelectionScreen] Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  }, [navigation, handleGalleryPress]);

  // Handle gallery press
  const handleGalleryPress = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Request media library permissions
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('[PhotoSelectionScreen] Gallery image selected:', imageUri);
        
        // Navigate based on mode
        if (mode === 'style') {
          navigation.navigate('EditCanvas', { 
            imageUri,
            source: 'gallery'
          });
        } else {
          navigation.navigate('Preview', { 
            imageUri,
            mode: 'empty'
          });
        }
      }
    } catch (error) {
      console.error('[PhotoSelectionScreen] Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  }, [navigation]);

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