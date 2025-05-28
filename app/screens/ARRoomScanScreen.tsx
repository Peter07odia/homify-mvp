import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
// Temporary fix for Expo Go compatibility
let Camera: any, useCameraDevices: any, useCameraPermission: any;
try {
  const visionCamera = require('react-native-vision-camera');
  Camera = visionCamera.Camera;
  useCameraDevices = visionCamera.useCameraDevices;
  useCameraPermission = visionCamera.useCameraPermission;
} catch (error) {
  // Fallback for Expo Go - vision camera not available
  Camera = null;
  useCameraDevices = () => [];
  useCameraPermission = () => ({ hasPermission: false, requestPermission: () => Promise.resolve({ granted: false }) });
}
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

type ARRoomScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ARRoomScan'>;
type ARRoomScanScreenRouteProp = RouteProp<RootStackParamList, 'ARRoomScan'>;

const ARRoomScanScreen = () => {
  const navigation = useNavigation<ARRoomScanScreenNavigationProp>();
  const route = useRoute<ARRoomScanScreenRouteProp>();
  const { roomType } = route.params;

  // Camera setup
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  // State management
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningMode, setScanningMode] = useState<'manual' | 'guided' | 'auto'>('guided');
  const [detectedFeatures, setDetectedFeatures] = useState({
    walls: 0,
    corners: 0,
    furniture: 0,
  });
  const [scanInstructions, setScanInstructions] = useState('Point your camera at a corner of the room to begin');

  // Animation values
  const scanProgressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    // Animate scan progress
    Animated.timing(scanProgressAnim, {
      toValue: scanProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [scanProgress]);

  useEffect(() => {
    // Pulse animation for scanning indicator
    if (isScanning) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isScanning) pulse();
        });
      };
      pulse();
    }
  }, [isScanning, pulseAnim]);

  const handleStartScan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsScanning(true);
    setScanProgress(0);
    setScanInstructions('Slowly move your device around the room');
    
    // Simulate scanning progress
    simulateScanProgress();
  }, []);

  const simulateScanProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 0.05;
      
      if (progress < 0.3) {
        setScanInstructions('Scanning walls and corners...');
        setDetectedFeatures(prev => ({
          ...prev,
          walls: Math.floor(progress * 10),
          corners: Math.floor(progress * 15),
        }));
      } else if (progress < 0.6) {
        setScanInstructions('Detecting furniture and objects...');
        setDetectedFeatures(prev => ({
          ...prev,
          furniture: Math.floor((progress - 0.3) * 20),
        }));
      } else if (progress < 0.9) {
        setScanInstructions('Finalizing room measurements...');
      } else {
        setScanInstructions('Scan complete! Processing results...');
      }
      
      setScanProgress(progress);
      
      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          handleScanComplete();
        }, 1500);
      }
    }, 200);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to results or back to room creation with scan data
    Alert.alert(
      'Scan Complete!',
      `Successfully scanned your ${roomType}. Room dimensions and furniture detected.`,
      [
        {
          text: 'View Results',
          onPress: () => {
            // Navigate to a results screen or back with scan data
            navigation.navigate('RoomCreation', {
              roomType,
              scanData: {
                dimensions: {
                  length: 4.2,
                  width: 3.8,
                  height: 2.7,
                },
                detectedFeatures,
                confidence: 0.92,
              },
            });
          },
        },
        {
          text: 'Scan Again',
          style: 'cancel',
          onPress: () => {
            setScanProgress(0);
            setDetectedFeatures({ walls: 0, corners: 0, furniture: 0 });
            setScanInstructions('Point your camera at a corner of the room to begin');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isScanning) {
      Alert.alert(
        'Stop Scanning?',
        'Are you sure you want to stop the current scan?',
        [
          { text: 'Continue Scanning', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: () => {
              setIsScanning(false);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleScanModeChange = (mode: 'manual' | 'guided' | 'auto') => {
    Haptics.selectionAsync();
    setScanningMode(mode);
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color="#CCBBAA" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            To scan your room, we need access to your camera
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#7C5C3E" />
          <Text style={styles.permissionTitle}>Loading Camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera View or Fallback */}
      {Camera && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          video={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraFallback]}>
          <View style={styles.fallbackContent}>
            <MaterialIcons name="videocam-off" size={64} color="#666666" />
            <Text style={styles.fallbackTitle}>Camera Not Available</Text>
            <Text style={styles.fallbackText}>
              AR scanning requires a development build.{'\n'}
              Using simulation mode for now.
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan {roomType}</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {/* Scanning Mode Selector */}
      {!isScanning && (
        <View style={styles.modeSelector}>
          <BlurView intensity={80} style={styles.modeSelectorBlur}>
            <Text style={styles.modeSelectorTitle}>Scanning Mode</Text>
            <View style={styles.modeButtons}>
              {(['guided', 'manual', 'auto'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    scanningMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => handleScanModeChange(mode)}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      scanningMode === mode && styles.modeButtonTextActive,
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </View>
      )}

      {/* Scanning Overlay */}
      {isScanning && (
        <View style={styles.scanningOverlay}>
          {/* Corner indicators */}
          <View style={styles.cornerIndicators}>
            <Animated.View style={[styles.cornerTL, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.cornerTR, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.cornerBL, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.cornerBR, { transform: [{ scale: pulseAnim }] }]} />
          </View>

          {/* Center scanning indicator */}
          <View style={styles.centerIndicator}>
            <Animated.View style={[styles.scanningDot, { transform: [{ scale: pulseAnim }] }]} />
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <BlurView intensity={80} style={styles.controlsBlur}>
          {/* Instructions */}
          <Text style={styles.instructions}>{scanInstructions}</Text>

          {/* Progress Bar */}
          {isScanning && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: scanProgressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(scanProgress * 100)}% Complete
              </Text>
            </View>
          )}

          {/* Detected Features */}
          {isScanning && (
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <MaterialIcons name="crop-square" size={16} color="#FFFFFF" />
                <Text style={styles.featureText}>{detectedFeatures.walls} Walls</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="crop-free" size={16} color="#FFFFFF" />
                <Text style={styles.featureText}>{detectedFeatures.corners} Corners</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="weekend" size={16} color="#FFFFFF" />
                <Text style={styles.featureText}>{detectedFeatures.furniture} Objects</Text>
              </View>
            </View>
          )}

          {/* Scan Button */}
          {!isScanning && (
            <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
              <MaterialIcons name="3d-rotation" size={32} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Start AR Scan</Text>
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 40,
  },
  modeSelector: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  modeSelectorBlur: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#7C5C3E',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  cornerIndicators: {
    ...StyleSheet.absoluteFillObject,
    margin: 40,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF88',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF88',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF88',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF88',
  },
  centerIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  scanningDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00FF88',
    opacity: 0.8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsBlur: {
    padding: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  instructions: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF88',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5C3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7C5C3E',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#7C5C3E',
  },
  cameraFallback: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContent: {
    alignItems: 'center',
    padding: 40,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ARRoomScanScreen; 