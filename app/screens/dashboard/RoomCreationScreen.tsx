import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation';
import * as ImagePicker from 'expo-image-picker';
import PhotoSourceActionSheet from '../../components/PhotoSourceActionSheet';

const { width } = Dimensions.get('window');

interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string[];
}

interface StylePreference {
  id: string;
  name: string;
  description: string;
  color: string;
}

type RoomCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RoomCreation'>;
type RoomCreationScreenRouteProp = RouteProp<RootStackParamList, 'RoomCreation'>;

const RoomCreationScreen = () => {
  const navigation = useNavigation<RoomCreationScreenNavigationProp>();
  const route = useRoute<RoomCreationScreenRouteProp>();
  const { roomType, scanData } = route.params;

  const [roomName, setRoomName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [roomLength, setRoomLength] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);

  // Initialize dimensions from scan data if available
  useEffect(() => {
    if (scanData?.dimensions) {
      setRoomLength(scanData.dimensions.length.toFixed(1));
      setRoomWidth(scanData.dimensions.width.toFixed(1));
    }
  }, [scanData]);

  const getRoomTemplates = (type: string): RoomTemplate[] => {
    const templates: Record<string, RoomTemplate[]> = {
      bedroom: [
        {
          id: 'master',
          name: 'Master Bedroom',
          description: 'Spacious with ensuite',
          icon: 'king-bed',
          gradient: ['#F3E5F5', '#E1BEE7'],
        },
        {
          id: 'guest',
          name: 'Guest Bedroom',
          description: 'Cozy and welcoming',
          icon: 'single-bed',
          gradient: ['#E8F5E8', '#C8E6C9'],
        },
        {
          id: 'kids',
          name: 'Kids Bedroom',
          description: 'Fun and functional',
          icon: 'child-care',
          gradient: ['#FFF3E0', '#FFE0B2'],
        },
        {
          id: 'teen',
          name: 'Teen Bedroom',
          description: 'Modern and personal',
          icon: 'school',
          gradient: ['#E3F2FD', '#BBDEFB'],
        },
      ],
      'living-room': [
        {
          id: 'family',
          name: 'Family Living Room',
          description: 'Comfortable for gatherings',
          icon: 'family-restroom',
          gradient: ['#E8F5E8', '#C8E6C9'],
        },
        {
          id: 'formal',
          name: 'Formal Living Room',
          description: 'Elegant and sophisticated',
          icon: 'chair',
          gradient: ['#F3E5F5', '#E1BEE7'],
        },
        {
          id: 'entertainment',
          name: 'Entertainment Room',
          description: 'Perfect for movie nights',
          icon: 'tv',
          gradient: ['#E3F2FD', '#BBDEFB'],
        },
        {
          id: 'reading',
          name: 'Reading Nook',
          description: 'Quiet and cozy',
          icon: 'menu-book',
          gradient: ['#FFF3E0', '#FFE0B2'],
        },
      ],
      kitchen: [
        {
          id: 'modern',
          name: 'Modern Kitchen',
          description: 'Sleek and efficient',
          icon: 'kitchen',
          gradient: ['#E3F2FD', '#BBDEFB'],
        },
        {
          id: 'farmhouse',
          name: 'Farmhouse Kitchen',
          description: 'Rustic and warm',
          icon: 'agriculture',
          gradient: ['#FFF3E0', '#FFE0B2'],
        },
        {
          id: 'galley',
          name: 'Galley Kitchen',
          description: 'Compact and functional',
          icon: 'straighten',
          gradient: ['#E8F5E8', '#C8E6C9'],
        },
        {
          id: 'island',
          name: 'Kitchen with Island',
          description: 'Central workspace',
          icon: 'countertops',
          gradient: ['#F3E5F5', '#E1BEE7'],
        },
      ],
      'dining-room': [
        {
          id: 'formal',
          name: 'Formal Dining',
          description: 'Elegant dinner parties',
          icon: 'restaurant',
          gradient: ['#F3E5F5', '#E1BEE7'],
        },
        {
          id: 'casual',
          name: 'Casual Dining',
          description: 'Everyday family meals',
          icon: 'dining',
          gradient: ['#E8F5E8', '#C8E6C9'],
        },
        {
          id: 'breakfast',
          name: 'Breakfast Nook',
          description: 'Cozy morning spot',
          icon: 'free-breakfast',
          gradient: ['#FFF3E0', '#FFE0B2'],
        },
        {
          id: 'open',
          name: 'Open Dining',
          description: 'Connected to kitchen',
          icon: 'open-in-full',
          gradient: ['#E3F2FD', '#BBDEFB'],
        },
      ],
    };
    return templates[type] || [];
  };

  const stylePreferences: StylePreference[] = [
    { id: 'modern', name: 'Modern', description: 'Clean lines, minimal', color: '#2196F3' },
    { id: 'traditional', name: 'Traditional', description: 'Classic, timeless', color: '#8D6E63' },
    { id: 'contemporary', name: 'Contemporary', description: 'Current, trendy', color: '#9C27B0' },
    { id: 'minimalist', name: 'Minimalist', description: 'Simple, uncluttered', color: '#607D8B' },
    { id: 'rustic', name: 'Rustic', description: 'Natural, cozy', color: '#795548' },
    { id: 'industrial', name: 'Industrial', description: 'Urban, edgy', color: '#424242' },
  ];

  const templates = getRoomTemplates(roomType);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      Alert.alert('Room Name Required', 'Please enter a name for your room.');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Template Required', 'Please select a room template.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create room object with all the collected data
    const roomData = {
      name: roomName,
      type: roomType,
      template: selectedTemplate,
      style: selectedStyle,
      dimensions: {
        length: roomLength,
        width: roomWidth,
      },
      isFavorite,
      createdAt: new Date().toISOString(),
    };

    console.log('Creating room with data:', roomData);

    // Show photo source action sheet instead of navigating directly
    setShowPhotoSourceSheet(true);
  };

  const handleTakePhoto = async () => {
    try {
      console.log('📸 [RoomCreation] Taking photo...');
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

      console.log('📸 [RoomCreation] Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 [RoomCreation] Navigating to EditCanvas with:', { imageUri, source: 'camera' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'camera'
        });
      } else {
        console.log('📸 [RoomCreation] Camera was canceled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      console.log('🖼️ [RoomCreation] Choosing from gallery...');
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

      console.log('🖼️ [RoomCreation] Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ [RoomCreation] Navigating to EditCanvas with:', { imageUri, source: 'gallery' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'gallery'
        });
      } else {
        console.log('🖼️ [RoomCreation] Gallery was canceled or no image selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const getRoomTypeTitle = (type: string) => {
    const titles: Record<string, string> = {
      bedroom: 'Bedroom',
      'living-room': 'Living Room',
      kitchen: 'Kitchen',
      'dining-room': 'Dining Room',
    };
    return titles[type] || type;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#7C5C3E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create {getRoomTypeTitle(roomType)}</Text>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <MaterialIcons 
            name={isFavorite ? "favorite" : "favorite-border"} 
            size={24} 
            color={isFavorite ? "#FF4444" : "#7C5C3E"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Room Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`My ${getRoomTypeTitle(roomType)}`}
            value={roomName}
            onChangeText={setRoomName}
            placeholderTextColor="#999999"
          />
        </View>

        {/* Room Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Template</Text>
          <Text style={styles.sectionSubtitle}>Select a template that matches your vision</Text>
          
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.id && styles.templateCardSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTemplate(template.id);
                }}
              >
                <LinearGradient
                  colors={template.gradient}
                  style={styles.templateGradient}
                >
                  <MaterialIcons 
                    name={template.icon as any} 
                    size={32} 
                    color="#7C5C3E" 
                  />
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                  
                  {selectedTemplate === template.id && (
                    <View style={styles.selectedIndicator}>
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Room Dimensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Dimensions (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Help us provide better recommendations</Text>
          
          <View style={styles.dimensionsRow}>
            <View style={styles.dimensionInput}>
              <Text style={styles.dimensionLabel}>Length (ft)</Text>
              <TextInput
                style={styles.dimensionTextInput}
                placeholder="12"
                value={roomLength}
                onChangeText={setRoomLength}
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />
            </View>
            
            <View style={styles.dimensionInput}>
              <Text style={styles.dimensionLabel}>Width (ft)</Text>
              <TextInput
                style={styles.dimensionTextInput}
                placeholder="10"
                value={roomWidth}
                onChangeText={setRoomWidth}
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />
            </View>
          </View>
        </View>

        {/* Style Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Preference (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred design style</Text>
          
          <View style={styles.stylesGrid}>
            {stylePreferences.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleChip,
                  selectedStyle === style.id && styles.styleChipSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedStyle(selectedStyle === style.id ? '' : style.id);
                }}
              >
                <View 
                  style={[
                    styles.styleColorDot, 
                    { backgroundColor: style.color }
                  ]} 
                />
                <Text style={[
                  styles.styleText,
                  selectedStyle === style.id && styles.styleTextSelected,
                ]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.createButton,
            (!roomName.trim() || !selectedTemplate) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateRoom}
          disabled={!roomName.trim() || !selectedTemplate}
        >
          <Text style={styles.createButtonText}>Continue to Photo</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  templateCard: {
    width: (width - 56) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: '#7C5C3E',
  },
  templateGradient: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  templateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dimensionInput: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  dimensionTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  styleChipSelected: {
    backgroundColor: '#7C5C3E',
    borderColor: '#7C5C3E',
  },
  styleColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  styleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  styleTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5C3E',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#CCBBAA',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default RoomCreationScreen; 