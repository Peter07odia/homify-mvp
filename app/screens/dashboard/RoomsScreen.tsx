import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation';
import type { DashboardTabParamList } from './DashboardScreen';
import * as ImagePicker from 'expo-image-picker';
import RoomActionSheet from './RoomActionSheet';
import PhotoSourceActionSheet from '../../components/PhotoSourceActionSheet';
import { roomImages } from '../../assets';
import PhotoStorageService, { SavedPhoto } from '../../utils/photoStorageService';
import { useImageActions } from '../../hooks/useImageActions';
import WorkflowIntegration from '../../utils/workflowIntegration';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const cardWidth = (width - 80) / 2; // 2 cards per row with larger margins

interface RoomType {
  id: string;
  title: string;
  image: any;
  description: string;
}

type RoomsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoomsScreenRouteProp = RouteProp<DashboardTabParamList, 'Rooms'>;

const RoomsScreen = () => {
  const navigation = useNavigation<RoomsScreenNavigationProp>();
  const route = useRoute<RoomsScreenRouteProp>();
  const [activeTab, setActiveTab] = useState<'start' | 'projects'>(() => {
    // Check if we should start on the projects tab (My Photos)
    return route.params?.initialTab === 'projects' ? 'projects' : 'start';
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  
  const { shareImage, saveImage } = useImageActions();

  // Load saved photos when component mounts or tab changes
  useEffect(() => {
    const loadSavedPhotos = async () => {
      try {
        const photos = await PhotoStorageService.loadPhotos();
        console.log('📸 [RoomsScreen] Loaded photos:', photos.length, photos.map(p => ({ id: p.id, status: p.status })));
        setSavedPhotos(photos);
      } catch (error) {
        console.error('Error loading saved photos:', error);
      }
    };

    if (activeTab === 'projects') {
      loadSavedPhotos();
    }
  }, [activeTab]);

  const handleTabPress = (tab: 'start' | 'projects') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleRoomPress = (roomType: string) => {
    console.log('[RoomsScreen] Room pressed:', roomType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRoomType(roomType);
    setShowActionSheet(true);
    console.log('[RoomsScreen] Action sheet should show for room:', roomType);
  };

  const handleScanRoom = () => {
    console.log('Scan room feature temporarily disabled');
    Alert.alert(
      'Feature Coming Soon',
      'AR room scanning will be available in a future update. Please use "Style Room with AI" for now.',
      [{ text: 'OK' }]
    );
  };

  const handleStyleWithAI = () => {
    console.log('[RoomsScreen] Style with AI selected for room:', selectedRoomType);
    // Show photo source action sheet instead of navigating directly
    setShowPhotoSourceSheet(true);
  };

  const handleTakePhoto = async () => {
    try {
      console.log('📸 Taking photo on physical device...');
      
      // Debug info
      console.log('📸 Device info:', {
        isDevice: Constants.isDevice,
        platform: Platform.OS,
        executionEnvironment: Constants.executionEnvironment
      });
      
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission:', cameraPermission);
      
      if (!cameraPermission.granted) {
        Alert.alert(
          'Camera Permission Required', 
          'Please allow camera access in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('📸 Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Navigating to EditCanvas with:', { imageUri, source: 'camera' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'camera',
          roomType: selectedRoomType
        });
      } else {
        console.log('📸 Camera was canceled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', `Failed to open camera: ${error.message}`);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      console.log('🖼️ Choosing from gallery...');
      
      // Check current permission status first
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('🖼️ Current gallery permission:', currentPermission);
      
      let libraryPermission = currentPermission;
      
      // Only request if not already granted
      if (!currentPermission.granted) {
        if (currentPermission.canAskAgain) {
          libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          console.log('🖼️ Requested gallery permission:', libraryPermission);
        } else {
          Alert.alert(
            'Permission Required', 
            'Photo library access was previously denied. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            ]
          );
          return;
        }
      }
      
      if (!libraryPermission.granted) {
        Alert.alert(
          'Permission needed', 
          'Photo library permission is required to select images. Please enable it in your device settings.'
        );
        return;
      }

      // Launch image picker with better configuration
      console.log('🖼️ Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false, // Reduce data to avoid potential issues
        base64: false, // Don't include base64 to reduce memory usage
      });

      console.log('🖼️ Gallery result:', {
        canceled: result.canceled,
        hasAssets: result.assets?.length || 0,
        firstAssetUri: result.assets?.[0]?.uri?.substring(0, 50) || 'none'
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ ✅ Successfully selected image, navigating to EditCanvas');
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'gallery',
          roomType: selectedRoomType
        });
      } else {
        console.log('🖼️ Gallery selection canceled or no valid image selected');
        if (result.canceled) {
          console.log('🖼️ User canceled the selection');
        } else {
          Alert.alert('No Image Selected', 'Please select a valid image from your gallery.');
        }
      }
    } catch (error) {
      console.error('🖼️ Gallery error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to open photo library';
      if (error.message?.includes('User denied permissions')) {
        errorMessage = 'Photo library access was denied. Please enable it in Settings.';
      } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        console.log('🖼️ User canceled - no error shown');
        return; // Don't show error for user cancellation
      }
      
      Alert.alert('Gallery Error', errorMessage, [
        { text: 'Try Again', onPress: handleChooseFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const handlePhotoAction = async (photo: SavedPhoto, action: 'download' | 'share') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const imageUrl = photo.styledUrl || photo.emptyUrl || photo.originalUrl;
      
      if (action === 'download') {
        await saveImage(imageUrl, photo.styledUrl ? 'styled' : 'empty');
      } else if (action === 'share') {
        await shareImage(imageUrl);
      }
    } catch (error) {
      console.error(`Error ${action}ing photo:`, error);
      Alert.alert('Error', `Failed to ${action} photo. Please try again.`);
    }
  };

  const formatPhotoDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Helper function to get the best display URL for a photo
  const getPhotoDisplayUrl = (photo: SavedPhoto): string => {
    // Priority: styled > empty > original
    return photo.styledUrl || photo.emptyUrl || photo.originalUrl;
  };

  // Helper function to get status text for photo
  const getPhotoStatusText = (photo: SavedPhoto): string => {
    if (photo.status === 'processing') {
      if (photo.emptyUrl && !photo.styledUrl) {
        return 'Styling in progress...';
      }
      return 'Processing...';
    }
    if (photo.status === 'completed' && photo.styledUrl) {
      return photo.style || 'Styled';
    }
    if (photo.status === 'completed' && photo.emptyUrl) {
      return 'Empty Room';
    }
    if (photo.status === 'failed') {
      return 'Failed - Tap to retry';
    }
    return 'Original';
  };

  // Handle photo press (clicking on photos in the grid)
  const handlePhotoPress = (photo: SavedPhoto) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    console.log('📸 [RoomsScreen] Photo pressed:', { id: photo.id, status: photo.status });
    
    if (photo.status === 'processing') {
      // If processing, navigate to a processing view or show more details
      navigation.navigate('ProcessingStatus', { 
        photoId: photo.id,
        originalUrl: photo.originalUrl,
        emptyUrl: photo.emptyUrl,
        styledUrl: photo.styledUrl,
        status: photo.status,
        style: photo.style,
        roomType: photo.roomType
      });
    } else if (photo.status === 'completed') {
      // If completed, navigate to comparison view
      if (photo.styledUrl && photo.originalUrl) {
        navigation.navigate('StyledRoom', {
          originalImageUri: photo.originalUrl,
          emptyRoomUrl: photo.emptyUrl || '',
          styledRoomUrl: photo.styledUrl,
          styleLabel: photo.style || 'Custom Style'
        });
      } else if (photo.emptyUrl && photo.originalUrl) {
        // Only empty room available, navigate to EditCanvas for styling
        navigation.navigate('EditCanvas', {
          imageUri: photo.originalUrl,
          source: 'gallery',
          existingEmptyUrl: photo.emptyUrl,
          mode: 'empty'
        });
      }
    } else if (photo.status === 'failed') {
      // If failed, offer options to retry or delete
      Alert.alert(
        'Failed Photo',
        'This photo failed to process. What would you like to do?',
        [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await PhotoStorageService.deletePhoto(photo.id);
              const updatedPhotos = await PhotoStorageService.loadPhotos();
              setSavedPhotos(updatedPhotos);
            }
          },
          {
            text: 'Retry Processing',
            onPress: async () => {
              try {
                // Restart the workflow for this photo
                const workflowId = await WorkflowIntegration.startRoomCreation(
                  photo.originalUrl,
                  photo.roomType || 'Living Room'
                );
                
                // Update photo status to processing
                await PhotoStorageService.updatePhoto(photo.id, {
                  status: 'processing'
                });
                
                // Reload photos to show the update
                const updatedPhotos = await PhotoStorageService.loadPhotos();
                setSavedPhotos(updatedPhotos);
                
                Alert.alert('Processing Started', 'The photo is now being processed again.');
              } catch (error) {
                console.error('Error retrying photo:', error);
                Alert.alert('Error', 'Failed to restart processing.');
              }
            }
          },
          {
            text: 'View Details',
            onPress: () => {
              // Show processing status even for failed photos
              navigation.navigate('ProcessingStatus', { 
                photoId: photo.id,
                originalUrl: photo.originalUrl,
                emptyUrl: photo.emptyUrl,
                styledUrl: photo.styledUrl,
                status: photo.status,
                style: photo.style,
                roomType: photo.roomType
              });
            }
          },
          { text: 'Cancel' }
        ]
      );
    }
  };

  // Test function to demonstrate workflow integration
  const testWorkflowIntegration = async () => {
    try {
      Alert.alert(
        'Test Workflow Integration',
        'Choose an action to test the workflow system.',
        [
          {
            text: 'Test Room Creation',
            onPress: async () => {
              const workflowId = await WorkflowIntegration.startRoomCreation(
                'https://example.com/test-room.jpg',
                'Living Room'
              );
              
              // Simulate completion after 3 seconds
              setTimeout(async () => {
                await WorkflowIntegration.completeRoomEmptying(
                  workflowId,
                  'https://example.com/empty-room.jpg'
                );
                
                // Reload photos to show the update
                const photos = await PhotoStorageService.loadPhotos();
                setSavedPhotos(photos);
              }, 3000);
              
              // Reload photos to show the processing state
              const photos = await PhotoStorageService.loadPhotos();
              setSavedPhotos(photos);
            }
          },
          {
            text: 'Check Existing Jobs',
            onPress: async () => {
              Alert.alert(
                'Check Processing Jobs',
                'This will manually check for any existing processing photos and start polling for their status.',
                [
                  {
                    text: 'Start Checking',
                    onPress: async () => {
                      await WorkflowIntegration.initializePolling();
                      Alert.alert('Success', 'Started checking for existing processing jobs.');
                    }
                  },
                  { text: 'Cancel' }
                ]
              );
            }
          },
          {
            text: 'Test Upstyling',
            onPress: async () => {
              const workflowId = await WorkflowIntegration.startUpstyling(
                'https://example.com/test-room.jpg',
                'Modern',
                'Bedroom'
              );
              
              // Simulate completion after 3 seconds
              setTimeout(async () => {
                await WorkflowIntegration.completeUpstyling(
                  workflowId,
                  'https://example.com/styled-room.jpg'
                );
                
                // Reload photos to show the update
                const photos = await PhotoStorageService.loadPhotos();
                setSavedPhotos(photos);
              }, 3000);
              
              // Reload photos to show the processing state
              const photos = await PhotoStorageService.loadPhotos();
              setSavedPhotos(photos);
            }
          },
          {
            text: 'Clear Failed Photos',
            onPress: async () => {
              const photos = await PhotoStorageService.loadPhotos();
              const failedPhotos = photos.filter(photo => photo.status === 'failed');
              
              if (failedPhotos.length === 0) {
                Alert.alert('No Failed Photos', 'There are no failed photos to clear.');
                return;
              }
              
              for (const photo of failedPhotos) {
                await PhotoStorageService.deletePhoto(photo.id);
              }
              
              // Reload photos to show the update
              const updatedPhotos = await PhotoStorageService.loadPhotos();
              setSavedPhotos(updatedPhotos);
              
              Alert.alert('Success', `Cleared ${failedPhotos.length} failed photos.`);
            }
          },
          {
            text: 'Clear ALL Photos',
            style: 'destructive',
            onPress: async () => {
              Alert.alert(
                'Clear All Photos',
                'This will permanently delete ALL photos from My Photos. Are you sure?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await PhotoStorageService.clearAllPhotos();
                        setSavedPhotos([]);
                        Alert.alert('Success', 'All photos have been cleared.');
                      } catch (error) {
                        console.error('Error clearing all photos:', error);
                        Alert.alert('Error', 'Failed to clear photos.');
                      }
                    }
                  }
                ]
              );
            }
          },
          { text: 'Cancel' }
        ]
      );
    } catch (error) {
      console.error('Error testing workflow:', error);
      Alert.alert('Error', 'Failed to test workflow integration.');
    }
  };

  const roomTypes: RoomType[] = [
    {
      id: 'bedroom',
      title: 'Bedroom',
      image: roomImages['bedroom'],
      description: '',
    },
    {
      id: 'living-room',
      title: 'Living Room',
      image: roomImages['living-room'],
      description: '',
    },
    {
      id: 'kitchen',
      title: 'Kitchen',
      image: roomImages['kitchen'],
      description: '',
    },
    {
      id: 'outdoor-space',
      title: 'Outdoor Space',
      image: roomImages['outdoor-space'],
      description: '',
    },
    {
      id: 'baby-kids-room',
      title: 'Baby & Kids Room',
      image: roomImages['baby-kids-room'],
      description: '',
    },
    {
      id: 'bathroom',
      title: 'Bathroom',
      image: roomImages['bathroom'],
      description: '',
    },
    {
      id: 'closet',
      title: 'Closet',
      image: roomImages['closet'],
      description: '',
    },
    {
      id: 'store',
      title: 'Store',
      image: roomImages['store'],
      description: '',
    },
    {
      id: 'home-office',
      title: 'Home Office',
      image: roomImages['home-office'],
      description: '',
    },
    {
      id: 'home-cinema',
      title: 'Home Cinema',
      image: roomImages['home-cinema'],
      description: '',
    },
    {
      id: 'cafe-bar',
      title: 'Cafe & Bar',
      image: roomImages['cafe-bar'],
      description: '',
    },
    {
      id: 'garage',
      title: 'Garage',
      image: roomImages['garage'],
      description: '',
    },
    {
      id: 'hallway',
      title: 'Hallway',
      image: roomImages['hallway'],
      description: '',
    },
    {
      id: 'dining-room',
      title: 'Dining Room',
      image: roomImages['dining-room'],
      description: '',
    },
    {
      id: 'gym',
      title: 'Gym',
      image: roomImages['gym'],
      description: '',
    },
    {
      id: 'laundry-room',
      title: 'Laundry Room',
      image: roomImages['laundry-room'],
      description: '',
    },
    {
      id: 'reception-area',
      title: 'Reception Area',
      image: roomImages['reception-area'],
      description: '',
    },
    {
      id: 'office',
      title: 'Office',
      image: roomImages['office'],
      description: '',
    },
  ];

  const renderStartJobTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>My Rooms</Text>
        <Text style={styles.tabSubtitle}>Choose a room type to get started</Text>
      </View>

      {/* Room Cards Grid */}
      <View style={styles.cardsGrid}>
        {roomTypes.map((room, index) => (
          <TouchableOpacity
            key={room.id}
            style={[
              styles.roomCard,
              index % 2 === 0 ? styles.cardLeft : styles.cardRight,
            ]}
            onPress={() => {
              console.log('[RoomsScreen] Room card touched:', room.id);
              handleRoomPress(room.id);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.roomImageContainer}>
              <Image source={room.image} style={styles.roomImage} />
              <View style={styles.roomOverlay} />
              
              {/* Plus icon */}
              <View style={styles.roomPlusIcon}>
                <MaterialIcons name="add" size={32} color="#FFFFFF" />
              </View>
            </View>
            
            {/* Text content below image */}
            <View style={styles.roomCardContent}>
              <Text style={styles.roomTitle}>{room.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderProjectsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* My Photos Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Photos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {savedPhotos.length === 0 ? (
        // Empty state
        <View style={styles.emptyPhotosState}>
          <MaterialIcons name="photo-library" size={48} color="#CCBBAA" />
          <Text style={styles.emptyPhotosTitle}>No Photos Yet</Text>
          <Text style={styles.emptyPhotosText}>
            Start creating or styling rooms to see your photos here
          </Text>
          
          {/* Test button for development - remove in production */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testWorkflowIntegration}
            >
              <MaterialIcons name="science" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Test Workflow</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Grid layout for photos
        <View style={styles.photosGrid}>
          {savedPhotos.slice(0, 6).map((photo, index) => (
            <TouchableOpacity 
              key={photo.id} 
              style={[
                styles.photoGridItem,
                index % 2 === 0 ? styles.photoGridItemLeft : styles.photoGridItemRight
              ]}
              onPress={() => handlePhotoPress(photo)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: getPhotoDisplayUrl(photo) }} 
                style={styles.photoGridImage}
                resizeMode="cover"
              />
              
              {/* Photo Info Overlay */}
              <View style={styles.photoGridOverlay}>
                <View style={styles.photoGridInfo}>
                  <Text style={styles.photoGridStyle} numberOfLines={1}>
                    {getPhotoStatusText(photo)}
                  </Text>
                  <Text style={styles.photoGridDate}>
                    {formatPhotoDate(photo.createdAt)}
                  </Text>
                </View>
                
                {/* Status indicator */}
                {photo.status === 'processing' && (
                  <View style={styles.processingIndicator}>
                    <MaterialIcons name="hourglass-empty" size={16} color="#FFFFFF" />
                  </View>
                )}
                
                {photo.status === 'completed' && photo.styledUrl && (
                  <View style={styles.completedIndicator}>
                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  </View>
                )}
                
                {photo.status === 'failed' && (
                  <View style={styles.failedIndicator}>
                    <MaterialIcons name="error" size={16} color="#FF5252" />
                  </View>
                )}
              </View>
              
              {/* Processing overlay for better UX */}
              {photo.status === 'processing' && (
                <View style={styles.processingGridOverlay}>
                  <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
                  <Text style={styles.processingGridText}>Tap to View</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          
          {/* Show more button if there are more than 6 photos */}
          {savedPhotos.length > 6 && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <MaterialIcons name="add" size={24} color="#7C5C3E" />
              <Text style={styles.viewMoreText}>View All ({savedPhotos.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Tab Header */}
      <View style={styles.header}>
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'start' && styles.activeTab]}
            onPress={() => handleTabPress('start')}
          >
            <Text style={[styles.tabText, activeTab === 'start' && styles.activeTabText]}>
              My Rooms
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
            onPress={() => handleTabPress('projects')}
          >
            <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
              My Photos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'start' ? renderStartJobTab() : renderProjectsTab()}

      {/* Room Action Sheet */}
      <RoomActionSheet
        visible={showActionSheet}
        onClose={() => {
          console.log('[RoomsScreen] Closing action sheet');
          setShowActionSheet(false);
        }}
        roomType={selectedRoomType}
        onScanRoom={handleScanRoom}
        onStyleWithAI={handleStyleWithAI}
      />

      {/* Debug: Test button to force show action sheet (remove in production) */}
      {__DEV__ && (
        <TouchableOpacity 
          style={{
            position: 'absolute',
            top: 100,
            right: 20,
            backgroundColor: 'red',
            padding: 10,
            borderRadius: 5,
            zIndex: 1000
          }}
          onPress={() => {
            console.log('[RoomsScreen] Debug: Force showing action sheet');
            setSelectedRoomType('bedroom');
            setShowActionSheet(true);
          }}
        >
          <Text style={{ color: 'white', fontSize: 10 }}>Debug</Text>
        </TouchableOpacity>
      )}

      {/* Photo Source Action Sheet */}
      <PhotoSourceActionSheet
        visible={showPhotoSourceSheet}
        onClose={() => {
          console.log('[RoomsScreen] Closing photo source sheet');
          setShowPhotoSourceSheet(false);
        }}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
      />


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#7C5C3E',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  tabHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  roomCard: {
    width: cardWidth,
    height: cardWidth * 1.4, // Make cards taller (4x4 aspect ratio with text space)
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardLeft: {
    marginRight: 8,
  },
  cardRight: {
    marginLeft: 8,
  },
  roomImageContainer: {
    height: cardWidth, // Square image container (4x4 aspect ratio)
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  roomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  roomPlusIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 92, 62, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'center',
  },
  roomDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#7C5C3E',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  photosContainer: {
    marginBottom: 16,
  },
  photosScrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  photoCard: {
    width: 200,
    height: 150,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  photoInfo: {
    flex: 1,
  },
  photoStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  photoActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCard: {
    width: 200,
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0D5C9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
    marginTop: 8,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(124, 92, 62, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyPhotosState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    minHeight: 200,
  },
  emptyPhotosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPhotosText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  testButton: {
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  photoGridItem: {
    width: '50%',
    height: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D5C9',
    borderStyle: 'solid',
  },
  photoGridItemLeft: {
    borderRightWidth: 0,
  },
  photoGridItemRight: {
    borderLeftWidth: 0,
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  photoGridInfo: {
    flex: 1,
  },
  photoGridStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  photoGridDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  processingIndicator: {
    backgroundColor: 'rgba(124, 92, 62, 0.8)',
    padding: 4,
    borderRadius: 12,
  },
  completedIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    padding: 4,
    borderRadius: 12,
  },
  failedIndicator: {
    backgroundColor: 'rgba(255, 82, 82, 0.8)',
    padding: 4,
    borderRadius: 12,
  },
  processingGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(124, 92, 62, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  viewMoreButton: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderColor: '#E0D5C9',
    borderStyle: 'solid',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
});

export default RoomsScreen; 