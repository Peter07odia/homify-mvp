import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  ScrollView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

import { pollJobStatus, uploadRoomImage, fixImageUrl } from '../services/roomService';
import { RootStackParamList } from '../navigation';

const { width } = Dimensions.get('window');
// Only show debug interface in development, not in production
const isDevelopment = false; // Setting to false to completely disable debug UI

type PreviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Preview'
>;

type PreviewScreenRouteProp = RouteProp<
  RootStackParamList,
  'Preview'
>;

const PreviewScreen = () => {
  const navigation = useNavigation<PreviewScreenNavigationProp>();
  const route = useRoute<PreviewScreenRouteProp>();
  const { imageUri, mode = 'empty' } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('Uploading...');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  
  // Animation values
  const sliderPosition = useRef(new Animated.Value(0.5)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const arrowsOpacity = useRef(new Animated.Value(0)).current;
  
  // Calculate slider width based on screen dimensions
  const imageSize = width - 40; // Same as previewImage width
  
  // Configure pan responder for draggable divider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // When user touches the divider, make it more visible
        Animated.parallel([
          Animated.timing(dividerOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowsOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Add haptic feedback when starting to drag
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position based on drag
        const newPosition = Math.max(0, Math.min(gestureState.moveX / imageSize, 1));
        sliderPosition.setValue(newPosition);
      },
      onPanResponderRelease: () => {
        // When user releases, fade the divider a bit
        Animated.parallel([
          Animated.timing(dividerOpacity, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowsOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Add haptic feedback when releasing drag
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  // Process image on component mount
  useEffect(() => {
    processImage();
    
    // Show arrows animation when images are loaded
    if (originalUrl && processedUrl) {
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(arrowsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [originalUrl, processedUrl]);

  // Upload and process the image
  const processImage = async () => {
    try {
      setLoading(true);
      setProcessingStatus('Uploading image...');
      
      // Check if image exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        setError('Image file not found. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('Processing image:', imageUri);
      console.log('File info:', JSON.stringify(fileInfo));
      
      // Upload the image
      try {
        console.log('Attempting to upload image...');
        const jobId = await uploadRoomImage(imageUri, mode);
        console.log('Job created with ID:', jobId);
        
        // Start polling for results with different messaging based on mode
        if (mode === 'empty') {
          setProcessingStatus('Removing furniture...');
        } else {
          setProcessingStatus('Preparing to clean your room...');
        }
        
        // Use a shorter timeout for faster feedback
        const pollingResult = await pollJobStatus(jobId, 2000, 15, (status) => {
          console.log('Status update:', status);
          if (status === 'processing') {
            if (mode === 'empty') {
              setProcessingStatus('Removing furniture and decor...');
            } else {
              setProcessingStatus('Adding new furniture styles...');
            }
          }
        });
        
        console.log('Processing complete, result:', JSON.stringify(pollingResult));
        
        if (pollingResult.status === 'error') {
          // Use the error message from the API if available, otherwise show a generic message
          const errorMessage = pollingResult.message || `Failed to ${mode === 'empty' ? 'empty' : 'clean'} your room. Please try again.`;
          setError(errorMessage);
          return;
        }
        
        // Process URLs
        handleProcessedResult(pollingResult);
      } catch (uploadError) {
        console.error('Error during upload or processing:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        setError(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to handle the processed result
  const handleProcessedResult = (result: any) => {
    if (result.originalUrl) {
      const fixedOriginalUrl = fixImageUrl(result.originalUrl);
      console.log('Setting original URL:', fixedOriginalUrl);
      setOriginalUrl(fixedOriginalUrl);
    }
    
    // Set the processed URL based on mode
    if (mode === 'empty' && result.emptyUrl) {
      const fixedEmptyUrl = fixImageUrl(result.emptyUrl);
      console.log('Setting empty URL:', fixedEmptyUrl);
      setProcessedUrl(fixedEmptyUrl);
    } else if (mode === 'clean' && result.cleanUrl) {
      const fixedCleanUrl = fixImageUrl(result.cleanUrl);
      console.log('Setting clean URL:', fixedCleanUrl);
      setProcessedUrl(fixedCleanUrl);
    } else {
      console.log('No processed URL available for mode:', mode);
      // Instead of offering a test image, treat this as an error
      setError(`No processed image was returned. Please try again.`);
      return;
    }
  };

  // Save image to camera roll
  const saveImage = async () => {
    try {
      if (!processedUrl) return;
      
      setDownloadingImage(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'We need permission to save the image to your camera roll.');
        setDownloadingImage(false);
        return;
      }
      
      // Download the image
      const fileUri = `${FileSystem.cacheDirectory}${mode}-room-${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(processedUrl, fileUri);
      
      // Save to camera roll
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Image saved to your camera roll.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save the image.');
    } finally {
      setDownloadingImage(false);
    }
  };

  // Share image
  const shareImage = async () => {
    try {
      if (!processedUrl) return;
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await Share.share({
        url: Platform.OS === 'ios' ? processedUrl : processedUrl,
        message: `Check out this ${mode === 'empty' ? 'empty' : 'clean'} room I created with Homify!`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share the image.');
    }
  };

  // Go back to camera
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  // Try again if error
  const handleTryAgain = () => {
    setError(null);
    processImage();
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#7C5C3E" />
        <Text style={styles.loadingText}>{processingStatus}</Text>
        <Text style={styles.timeEstimate}>This may take up to 15 seconds</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleTryAgain}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mode === 'empty' ? 'Empty Room' : 'Clean Room'}</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Advanced Image Comparison UI */}
        <View style={styles.comparisonContainer}>
          {originalUrl && processedUrl ? (
            <View style={styles.imageContainer}>
              {/* Original Image (Full Width) */}
              <Image 
                source={{ uri: originalUrl }} 
                style={styles.fullImage} 
                resizeMode="cover"
              />
              
              {/* Processed Image (Partially Visible) */}
              <Animated.View 
                style={[
                  styles.processedImageContainer, 
                  { width: sliderPosition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, imageSize]
                  }) }
                ]}
              >
                <Image 
                  source={{ uri: processedUrl }} 
                  style={styles.processedImage} 
                  resizeMode="cover"
                />
              </Animated.View>
              
              {/* Draggable Divider */}
              <Animated.View
                style={[
                  styles.sliderThumb,
                  {
                    left: sliderPosition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, imageSize - 30]
                    }),
                    opacity: dividerOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1]
                    })
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.sliderThumbLine} />
              </Animated.View>
              
              {/* Left/Right Arrows Overlay */}
              <Animated.View style={[styles.arrowsContainer, { opacity: arrowsOpacity }]}>
                <MaterialIcons name="chevron-left" size={32} color="white" />
                <MaterialIcons name="chevron-right" size={32} color="white" />
              </Animated.View>
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Text>Images not available</Text>
            </View>
          )}
          
          {/* Labels */}
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Original</Text>
            <Text style={styles.labelText}>{mode === 'empty' ? 'Empty' : 'Clean'}</Text>
          </View>
          
          <Text style={styles.captionText}>
            Slide to compare the before and after images
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, !processedUrl && styles.disabledButton]} 
            onPress={saveImage}
            disabled={!processedUrl || downloadingImage}
          >
            {downloadingImage ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialIcons name="save-alt" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton, !processedUrl && styles.disabledButton]} 
            onPress={shareImage}
            disabled={!processedUrl}
          >
            <MaterialIcons name="share" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#7C5C3E',
    textAlign: 'center',
  },
  timeEstimate: {
    marginTop: 8,
    fontSize: 14,
    color: '#8B7E74',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    fontSize: 16,
    color: '#D33939',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
    color: '#7C5C3E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  comparisonContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: width - 40,
    height: width - 40,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  processedImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  processedImage: {
    width: width - 40,
    height: '100%',
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderThumbLine: {
    width: 3,
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    transform: [{ translateY: -16 }],
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#7C5C3E',
    fontWeight: '600',
  },
  captionText: {
    fontSize: 14,
    color: '#8B7E74',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginHorizontal: 6,
    backgroundColor: '#E0D5C9',
  },
  primaryActionButton: {
    backgroundColor: '#7C5C3E',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  primaryActionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholderImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: 12,
    backgroundColor: '#E0D5C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7C5C3E',
    width: '80%',
  },
  backButtonText: {
    color: '#7C5C3E',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
});

export default PreviewScreen; 