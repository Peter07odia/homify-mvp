import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

const CameraScreen = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const route = useRoute<CameraScreenRouteProp>();
  const { returnToPreview, activeJobId } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  // Swipe gesture handling
  const pan = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100;
  const velocityThreshold = 0.3;

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
        pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        
        if (Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold) {
          if (dx > 0) {
            // Swipe right - go back
            handleSwipeBack();
          } else {
            // Swipe left - pick image from gallery
            handleSwipeForward();
          }
        }
        
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleSwipeBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleBack();
  }, []);

  const handleSwipeForward = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickImage();
  }, []);

  // Local state
  const [showActiveJobBanner, setShowActiveJobBanner] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo) {
        console.log('[CameraScreen] Photo captured:', photo.uri);
        navigation.navigate('EditCanvas', { 
          imageUri: photo.uri,
          source: 'camera',
          mode: 'empty'
        });
      }
    } catch (error) {
      console.error('[CameraScreen] Capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [navigation, isCapturing]);

  // Handle return to preview
  const handleReturnToPreview = useCallback(() => {
    console.log('[CameraScreen] Return to preview requested');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Since we removed global state, just hide the banner
    setShowActiveJobBanner(false);
  }, []);

  // Check for active jobs on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[CameraScreen] Screen focused');
      // Since we removed global state, just hide any existing banner
      setShowActiveJobBanner(false);
    }, [])
  );

  // Handle flip camera
  const toggleCameraFacing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  // Handle flash toggle
  const toggleFlash = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }, []);

  // Request permission if needed
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    console.log('[CameraScreen] Mounted with params:', { returnToPreview, activeJobId });
  }, [returnToPreview, activeJobId]);

  // Handle picking image from gallery
  const pickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('EditCanvas', { 
          imageUri: result.assets[0].uri, 
          source: 'gallery',
          mode: 'empty' 
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle permission not granted
  if (!permission) {
    return <View style={styles.loadingContainer}>
      <StatusBar style="dark" />
      <ActivityIndicator size="large" color="#7C5C3E" />
      <Text style={styles.loadingText}>Loading camera...</Text>
    </View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="dark" />
        <Text style={styles.permissionText}>
          We need camera permission to continue.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#E0D5C9' }]}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.goBack();
          }}
        >
          <Text style={[styles.permissionButtonText, { color: '#7C5C3E' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.innerContainer}>
        <StatusBar style="light" />
        
        {/* Active Job Banner */}
        {showActiveJobBanner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>You have an image being processed</Text>
            <TouchableOpacity onPress={handleReturnToPreview}>
              <Text style={styles.bannerAction}>Return to Preview</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Camera View */}
        <CameraView 
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Take Photo</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Flash Toggle */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <MaterialIcons 
                name={flash === 'on' ? 'flash-on' : 'flash-off'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.capturingButton]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Flip Camera */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  innerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  capturingButton: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#7C5C3E',
    marginTop: 10,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#7C5C3E',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
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

export default CameraScreen; 