import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';
import * as ImagePicker from 'expo-image-picker';
import RoomActionSheet from './RoomActionSheet';
import PhotoSourceActionSheet from '../../components/PhotoSourceActionSheet';
import { roomImages } from '../../assets';

const { width } = Dimensions.get('window');
const cardWidth = (width - 80) / 2; // 2 cards per row with larger margins

interface RoomType {
  id: string;
  title: string;
  image: any;
  description: string;
}

interface Project {
  id: string;
  roomType: string;
  style: string;
  date: string;
  thumbnail: any;
  status: 'completed' | 'in-progress' | 'saved';
}

type RoomsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RoomsScreen = () => {
  const navigation = useNavigation<RoomsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'start' | 'projects'>('start');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('');

  const handleTabPress = (tab: 'start' | 'projects') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleRoomPress = (roomType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRoomType(roomType);
    setShowActionSheet(true);
  };

  const handleScanRoom = () => {
    console.log('Scan room with AR for:', selectedRoomType);
    // Navigate to AR room scanning screen
    navigation.navigate('ARRoomScan', { 
      roomType: selectedRoomType 
    });
  };

  const handleStyleWithAI = () => {
    // Show photo source action sheet instead of navigating directly
    setShowPhotoSourceSheet(true);
  };

  const handleTakePhoto = async () => {
    try {
      console.log('📸 [RoomsScreen] Taking photo...');
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('📸 [RoomsScreen] Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 [RoomsScreen] Navigating to EditCanvas with:', { imageUri, source: 'camera' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'camera'
        });
      } else {
        console.log('📸 [RoomsScreen] Camera was canceled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      console.log('🖼️ [RoomsScreen] Choosing from gallery...');
      // Request media library permissions
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('🖼️ [RoomsScreen] Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ [RoomsScreen] Navigating to EditCanvas with:', { imageUri, source: 'gallery' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'gallery'
        });
      } else {
        console.log('🖼️ [RoomsScreen] Gallery was canceled or no image selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
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

  const mockProjects: Project[] = [
    {
      id: '1',
      roomType: 'Living Room',
      style: 'Contemporary',
      date: '2 hours ago',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'completed',
    },
    {
      id: '2',
      roomType: 'Bedroom',
      style: 'Scandinavian',
      date: 'Yesterday',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'in-progress',
    },
    {
      id: '3',
      roomType: 'Kitchen',
      style: 'Mid-Century Modern',
      date: '3 days ago',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'saved',
    },
    {
      id: '4',
      roomType: 'Bathroom',
      style: 'Industrial',
      date: '1 week ago',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'completed',
    },
    {
      id: '5',
      roomType: 'Home Office',
      style: 'Boho',
      date: '2 weeks ago',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'saved',
    },
    {
      id: '6',
      roomType: 'Outdoor Space',
      style: 'Mediterranean',
      date: '3 weeks ago',
      thumbnail: require('../../assets/emptyroom.png'),
      status: 'completed',
    },
  ];

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in-progress':
        return '#FF9800';
      case 'saved':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'saved':
        return 'Saved';
      default:
        return 'Unknown';
    }
  };

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
            onPress={() => handleRoomPress(room.id)}
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
    <View style={styles.tabContent}>
      {/* Empty content - no header, no filters, no projects */}
    </View>
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
        onClose={() => setShowActionSheet(false)}
        roomType={selectedRoomType}
        onScanRoom={handleScanRoom}
        onStyleWithAI={handleStyleWithAI}
      />

      {/* Photo Source Action Sheet */}
      <PhotoSourceActionSheet
        visible={showPhotoSourceSheet}
        onClose={() => setShowPhotoSourceSheet(false)}
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
  projectsList: {
    paddingHorizontal: 20,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  projectThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectRoomType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  projectStyle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#7C5C3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RoomsScreen; 