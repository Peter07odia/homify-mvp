import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

import { pollJobStatus, uploadRoomImage } from '../services/roomService';
import { RootStackParamList } from '../navigation';

const { width } = Dimensions.get('window');

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
  const [sliderValue, setSliderValue] = useState(0.5);
  const [downloadingImage, setDownloadingImage] = useState(false);
  
  // Process image on component mount
  useEffect(() => {
    processImage();
  }, []);

  // Upload and process the image
  const processImage = async () => {
    try {
      setLoading(true);
      setProcessingStatus('Uploading image...');
      
      // Upload the image
      const jobId = await uploadRoomImage(imageUri, mode);
      
      // Start polling for results with different messaging based on mode
      if (mode === 'empty') {
        setProcessingStatus('Removing furniture...');
      } else {
        setProcessingStatus('Preparing to upstyle your room...');
      }
      
      const result = await pollJobStatus(jobId, 2000, 45, (status) => {
        if (status === 'processing') {
          if (mode === 'empty') {
            setProcessingStatus('Removing furniture and decor...');
          } else {
            setProcessingStatus('Adding new furniture styles...');
          }
        }
      });
      
      if (result.status === 'error') {
        setError(`Failed to ${mode === 'empty' ? 'empty' : 'upstyle'} your room. Please try again.`);
        return;
      }
      
      if (result.originalUrl) {
        setOriginalUrl(result.originalUrl);
      }
      
      if (mode === 'empty' && result.emptyUrl) {
        setProcessedUrl(result.emptyUrl);
      } else if (mode === 'upstyle' && result.upstyleUrl) {
        setProcessedUrl(result.upstyleUrl);
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
        message: `Check out this ${mode === 'empty' ? 'empty' : 'upstyled'} room I created with Homify!`,
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

  // Determine which image to show based on slider value
  const displayImage = sliderValue > 0.5 ? processedUrl : originalUrl;
  
  // Set appropriate titles based on mode
  const headerTitle = mode === 'empty' ? 'Empty Room' : 'Upstyled Room';
  const beforeLabel = 'Original';
  const afterLabel = mode === 'empty' ? 'Empty' : 'Upstyled';

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
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text>Image not available</Text>
            </View>
          )}
        </View>
        
        {/* Before/After Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>{beforeLabel}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            onValueChange={setSliderValue}
            minimumTrackTintColor="#E0D5C9"
            maximumTrackTintColor="#7C5C3E"
            thumbTintColor="#7C5C3E"
          />
          <Text style={styles.sliderLabel}>{afterLabel}</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={saveImage}
            disabled={downloadingImage}
          >
            {downloadingImage ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>Save to Photos</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={shareImage}>
            <Text style={styles.actionButtonText}>Share</Text>
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
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: 12,
  },
  placeholderImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: 12,
    backgroundColor: '#E0D5C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    width: 60,
    color: '#7C5C3E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
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
  },
  backButtonText: {
    color: '#7C5C3E',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PreviewScreen; 