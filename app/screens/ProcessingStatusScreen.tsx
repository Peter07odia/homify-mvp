import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { RootStackParamList } from '../navigation';
import PhotoStorageService, { SavedPhoto } from '../utils/photoStorageService';

const { width } = Dimensions.get('window');

type ProcessingStatusNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProcessingStatus'
>;

type ProcessingStatusRouteProp = RouteProp<
  RootStackParamList,
  'ProcessingStatus'
>;

const ProcessingStatusScreen = () => {
  const navigation = useNavigation<ProcessingStatusNavigationProp>();
  const route = useRoute<ProcessingStatusRouteProp>();
  const { photoId, originalUrl, emptyUrl, styledUrl, status, style, roomType } = route.params;

  const [photo, setPhoto] = useState<SavedPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load photo details
  const loadPhoto = useCallback(async () => {
    try {
      const photos = await PhotoStorageService.loadPhotos();
      const currentPhoto = photos.find(p => p.id === photoId);
      setPhoto(currentPhoto || null);
    } catch (error) {
      console.error('Error loading photo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [photoId]);

  // Refresh photo status
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhoto();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadPhoto]);

  // Auto-refresh every 5 seconds if still processing
  useEffect(() => {
    loadPhoto();
    
    const interval = setInterval(() => {
      if (photo?.status === 'processing') {
        loadPhoto();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadPhoto, photo?.status]);

  // Handle navigation back
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle continue styling (if empty room is ready)
  const handleContinueStyling = () => {
    if (photo?.emptyUrl) {
      navigation.navigate('EditCanvas', {
        imageUri: originalUrl,
        source: 'gallery',
        existingEmptyUrl: photo.emptyUrl,
        mode: 'empty'
      });
    }
  };

  // Handle view styled result
  const handleViewResult = () => {
    if (photo?.styledUrl) {
      navigation.navigate('StyledRoom', {
        originalImageUri: originalUrl,
        emptyRoomUrl: photo.emptyUrl || '',
        styledRoomUrl: photo.styledUrl,
        styleLabel: photo.style || 'Custom Style'
      });
    }
  };

  // Get current stage info
  const getStageInfo = () => {
    if (!photo) return { stage: 'loading', message: 'Loading...', progress: 0 };
    
    if (photo.status === 'completed') {
      if (photo.styledUrl) {
        return { stage: 'completed', message: 'Complete!', progress: 100 };
      }
      if (photo.emptyUrl) {
        return { stage: 'empty_ready', message: 'Empty room ready', progress: 50 };
      }
    }
    
    if (photo.status === 'processing') {
      if (photo.emptyUrl && !photo.styledUrl) {
        return { stage: 'styling', message: 'Applying style...', progress: 75 };
      }
      return { stage: 'emptying', message: 'Creating empty room...', progress: 25 };
    }
    
    if (photo.status === 'failed') {
      return { stage: 'failed', message: 'Processing failed', progress: 0 };
    }
    
    return { stage: 'processing', message: 'Processing...', progress: 10 };
  };

  const stageInfo = getStageInfo();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C5C3E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.innerContainer}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#7C5C3E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Processing Status</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color="#7C5C3E" 
              style={refreshing ? styles.spinning : {}}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>{stageInfo.message}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${stageInfo.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{stageInfo.progress}% Complete</Text>
          </View>

          {/* Stage Indicators */}
          <View style={styles.stageSection}>
            <View style={styles.stageItem}>
              <View style={[
                styles.stageIcon,
                stageInfo.progress > 0 ? styles.stageIconCompleted : styles.stageIconPending
              ]}>
                {stageInfo.progress > 0 ? (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="upload" size={16} color="#CCCCCC" />
                )}
              </View>
              <Text style={styles.stageText}>Upload Complete</Text>
            </View>

            <View style={styles.stageLine} />

            <View style={styles.stageItem}>
              <View style={[
                styles.stageIcon,
                stageInfo.progress >= 50 ? styles.stageIconCompleted : 
                stageInfo.progress > 25 ? styles.stageIconActive : styles.stageIconPending
              ]}>
                {stageInfo.progress >= 50 ? (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                ) : stageInfo.progress > 25 ? (
                  <ActivityIndicator size={16} color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="home" size={16} color="#CCCCCC" />
                )}
              </View>
              <Text style={styles.stageText}>Empty Room</Text>
            </View>

            <View style={styles.stageLine} />

            <View style={styles.stageItem}>
              <View style={[
                styles.stageIcon,
                stageInfo.progress >= 100 ? styles.stageIconCompleted : 
                stageInfo.progress > 50 ? styles.stageIconActive : styles.stageIconPending
              ]}>
                {stageInfo.progress >= 100 ? (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                ) : stageInfo.progress > 50 ? (
                  <ActivityIndicator size={16} color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="palette" size={16} color="#CCCCCC" />
                )}
              </View>
              <Text style={styles.stageText}>Apply Style</Text>
            </View>
          </View>

          {/* Image Preview Section */}
          <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>Current Progress</Text>
            
            <View style={styles.imageGrid}>
              {/* Original Image */}
              <View style={styles.imageItem}>
                <Text style={styles.imageLabel}>Original</Text>
                <Image source={{ uri: originalUrl }} style={styles.previewImage} resizeMode="cover" />
              </View>

              {/* Empty Room (if available) */}
              {photo?.emptyUrl && (
                <View style={styles.imageItem}>
                  <Text style={styles.imageLabel}>Empty Room</Text>
                  <TouchableOpacity 
                    onPress={handleContinueStyling}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo.emptyUrl }} style={styles.previewImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="touch-app" size={24} color="#FFFFFF" />
                      <Text style={styles.overlayText}>Tap to Style</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Styled Result (if available) */}
              {photo?.styledUrl && (
                <View style={styles.imageItem}>
                  <Text style={styles.imageLabel}>Styled ({photo.style})</Text>
                  <TouchableOpacity 
                    onPress={handleViewResult}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo.styledUrl }} style={styles.previewImage} resizeMode="cover" />
                    <View style={styles.imageOverlay}>
                      <MaterialIcons name="visibility" size={24} color="#FFFFFF" />
                      <Text style={styles.overlayText}>View Result</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {photo?.emptyUrl && !photo?.styledUrl && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleContinueStyling}
              >
                <MaterialIcons name="palette" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Continue Styling</Text>
              </TouchableOpacity>
            )}

            {photo?.styledUrl && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleViewResult}
              >
                <MaterialIcons name="visibility" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>View Final Result</Text>
              </TouchableOpacity>
            )}

            {photo?.status === 'failed' && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  // TODO: Implement retry logic
                  Alert.alert('Retry', 'Retry functionality will be implemented soon.');
                }}
              >
                <MaterialIcons name="refresh" size={20} color="#7C5C3E" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7C5C3E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  content: {
    flex: 1,
  },
  progressSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C5C3E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  stageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  stageItem: {
    alignItems: 'center',
  },
  stageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  stageIconActive: {
    backgroundColor: '#7C5C3E',
  },
  stageIconPending: {
    backgroundColor: '#E0E0E0',
  },
  stageText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  stageLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  imageSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  imageSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageItem: {
    width: width > 600 ? '30%' : '48%',
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(124, 92, 62, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  actionSection: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5C3E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C5C3E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
    marginLeft: 8,
  },
});

export default ProcessingStatusScreen; 