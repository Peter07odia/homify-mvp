import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface BlurToleranceLoaderProps {
  imageUri: string;
  progress: number; // 0 to 1 (will be converted to 0-100 internally)
  status: string;
  isVisible: boolean;
}

const BlurToleranceLoader: React.FC<BlurToleranceLoaderProps> = ({
  imageUri,
  progress,
  status,
  isVisible,
}) => {
  // Convert 0-1 progress to 0-100 percentage
  const progressPercentage = Math.min(100, Math.max(0, progress * 100));
  
  const blurAnim = useRef(new Animated.Value(15)).current; // Start with high blur
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0.8)).current; // Start more opaque
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Create pulsing animation for loading indicator
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isVisible && progressPercentage < 100) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }
    
    return () => pulseAnimation.stop();
  }, [isVisible, progressPercentage, pulseAnim]);

  // Animate blur reduction and overlay opacity based on progress
  useEffect(() => {
    // Blur reduces more dramatically as we get closer to completion
    const targetBlur = Math.max(0, 15 - (progressPercentage / 100) * 15);
    
    // Overlay becomes more transparent as processing progresses
    const targetOverlayOpacity = Math.max(0.1, 0.8 - (progressPercentage / 100) * 0.7);
    
    Animated.parallel([
      Animated.timing(blurAnim, {
        toValue: targetBlur,
        duration: 800,
        useNativeDriver: false, // Can't use native driver for blur
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: targetOverlayOpacity,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progressPercentage, blurAnim, overlayOpacityAnim]);

  // Handle visibility
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, opacityAnim]);

  if (!isVisible) return null;

  // Processing stage indicators based on progress
  const getProcessingStage = () => {
    if (progressPercentage < 10) return "🔄";
    if (progressPercentage < 30) return "📐";
    if (progressPercentage < 50) return "🎨";
    if (progressPercentage < 80) return "✨";
    return "🏠";
  };

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      {/* User's actual image with progressive blur reduction */}
      <Animated.Image
        source={{ uri: imageUri }}
        style={[
          styles.backgroundImage,
          {
            opacity: 1, // Always show the image
          },
        ]}
        blurRadius={blurAnim}
      />
      
      {/* Dynamic overlay that becomes more transparent */}
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity: overlayOpacityAnim,
          }
        ]} 
      />
      
      {/* Central loading indicator */}
      <View style={styles.centerContent}>
        <Animated.View 
          style={[
            styles.loadingContainer,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <Text style={styles.stageIcon}>{getProcessingStage()}</Text>
          <ActivityIndicator size="large" color="#7C5C3E" />
          <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
          
          {/* Progress ring/bar */}
          <View style={styles.progressRing}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: progressPercentage > 80 ? '#4CAF50' : '#7C5C3E',
                }
              ]} 
            />
          </View>
        </Animated.View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
          <Text style={styles.statusSubtext}>
            {progressPercentage < 30 ? 'Analyzing your room...' :
             progressPercentage < 60 ? 'Processing image...' :
             progressPercentage < 90 ? 'Adding final touches...' :
             'Almost ready!'}
          </Text>
        </View>
      </View>
      
      {/* Reveal hint when near completion */}
      {progressPercentage > 85 && (
        <Animated.View style={[styles.revealHint, { opacity: pulseAnim }]}>
          <Text style={styles.revealHintText}>✨ Your room is being revealed!</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 100,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 249, 245, 0.7)',
  },
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 120,
  },
  progressText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  statusText: {
    fontSize: 16,
    color: '#7C5C3E',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  stageIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  progressRing: {
    width: 100,
    height: 6,
    backgroundColor: 'rgba(124, 92, 62, 0.2)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#8B7E74',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  revealHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  revealHintText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C5C3E',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});

export default BlurToleranceLoader; 