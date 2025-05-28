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
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { RoomStyleImages } from '../assets/room-style';

const { width, height } = Dimensions.get('window');

interface StyleOption {
  id: string;
  name: string;
  description: string;
  gradient: string[];
  preview: any;
}

interface RoomOption {
  id: string;
  name: string;
}

type EditCanvasScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditCanvas'>;
type EditCanvasScreenRouteProp = RouteProp<RootStackParamList, 'EditCanvas'>;

const EditCanvasScreen = () => {
  const navigation = useNavigation<EditCanvasScreenNavigationProp>();
  const route = useRoute<EditCanvasScreenRouteProp>();
  const { imageUri, source } = route.params;

  const [selectedStyle, setSelectedStyle] = useState('contemporary');
  const [selectedRoom, setSelectedRoom] = useState('living-room');
  const [selectedQuality, setSelectedQuality] = useState('HD');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const styleOptions: StyleOption[] = [
    {
      id: 'contemporary',
      name: 'Contemporary',
      description: 'Modern & sleek',
      gradient: ['#667eea', '#764ba2'],
      preview: RoomStyleImages.Contemporary,
    },
    {
      id: 'scandinavian',
      name: 'Scandinavian',
      description: 'Light & cozy',
      gradient: ['#4facfe', '#00f2fe'],
      preview: RoomStyleImages.Scandinavian,
    },
    {
      id: 'industrial',
      name: 'Industrial',
      description: 'Urban & edgy',
      gradient: ['#43e97b', '#38f9d7'],
      preview: RoomStyleImages.Industrial,
    },
    {
      id: 'bohemian',
      name: 'Bohemian',
      description: 'Eclectic & warm',
      gradient: ['#fa709a', '#fee140'],
      preview: RoomStyleImages.Boho,
    },
    {
      id: 'traditional',
      name: 'Traditional',
      description: 'Classic & timeless',
      gradient: ['#a8edea', '#fed6e3'],
      preview: RoomStyleImages.Classic,
    },
    {
      id: 'mid-century-modern',
      name: 'Mid-Century Modern',
      description: 'Retro & iconic',
      gradient: ['#ff9a9e', '#fecfef'],
      preview: RoomStyleImages['Mid-Century Modern'],
    },
    {
      id: 'transitional',
      name: 'Transitional',
      description: 'Balanced & versatile',
      gradient: ['#a8edea', '#fed6e3'],
      preview: RoomStyleImages.Transitional,
    },
    {
      id: 'farmhouse',
      name: 'Farmhouse',
      description: 'Rustic & cozy',
      gradient: ['#d299c2', '#fef9d7'],
      preview: RoomStyleImages.Farmhouse,
    },
    {
      id: 'mediterranean',
      name: 'Mediterranean',
      description: 'Warm & inviting',
      gradient: ['#89f7fe', '#66a6ff'],
      preview: RoomStyleImages.Mediterranean,
    },
    {
      id: 'asian',
      name: 'Asian',
      description: 'Zen & harmonious',
      gradient: ['#ffecd2', '#fcb69f'],
      preview: RoomStyleImages.Asian,
    },
    {
      id: 'oriental',
      name: 'Oriental',
      description: 'Exotic & elegant',
      gradient: ['#ff9a9e', '#fad0c4'],
      preview: RoomStyleImages.Oriental,
    },
    {
      id: 'serene-zen',
      name: 'Serene Zen',
      description: 'Peaceful & minimal',
      gradient: ['#e0c3fc', '#9bb5ff'],
      preview: RoomStyleImages['Serene Zen'],
    },
    {
      id: 'wabi-sabi',
      name: 'Wabi-Sabi',
      description: 'Imperfect beauty',
      gradient: ['#ffecd2', '#fcb69f'],
      preview: RoomStyleImages['Wabi-Sabi'],
    },
    {
      id: 'rustic-log-cabin',
      name: 'Rustic Log Cabin',
      description: 'Natural & cozy',
      gradient: ['#d299c2', '#fef9d7'],
      preview: RoomStyleImages['Rustic Log Cabin Living Room'],
    },
    {
      id: 'shabby-chic',
      name: 'Shabby Chic',
      description: 'Vintage & romantic',
      gradient: ['#ffecd2', '#fcb69f'],
      preview: RoomStyleImages['Shabby Chic'],
    },
    {
      id: 'craftsman',
      name: 'Craftsman',
      description: 'Handcrafted & warm',
      gradient: ['#d299c2', '#fef9d7'],
      preview: RoomStyleImages.Craftsman,
    },
    {
      id: 'victorian-elegance',
      name: 'Victorian Elegance',
      description: 'Ornate & luxurious',
      gradient: ['#667eea', '#764ba2'],
      preview: RoomStyleImages['Victorian Elegance'],
    },
    {
      id: 'coastal',
      name: 'Coastal',
      description: 'Breezy & relaxed',
      gradient: ['#4facfe', '#00f2fe'],
      preview: RoomStyleImages.Coastal,
    },
    {
      id: 'tropical',
      name: 'Tropical',
      description: 'Lush & vibrant',
      gradient: ['#56ab2f', '#a8e6cf'],
      preview: RoomStyleImages.Tropical,
    },
    {
      id: 'southwestern',
      name: 'Southwestern',
      description: 'Desert & earthy',
      gradient: ['#fa709a', '#fee140'],
      preview: RoomStyleImages.Southwestern,
    },
    {
      id: 'retro-1970s',
      name: 'Retro 1970s',
      description: 'Groovy & vibrant',
      gradient: ['#ff9a9e', '#fecfef'],
      preview: RoomStyleImages['Retro 1970s'],
    },
    {
      id: '1960s-retro',
      name: '1960s Retro',
      description: 'Mod & psychedelic',
      gradient: ['#667eea', '#764ba2'],
      preview: RoomStyleImages['1960s Retro'],
    },
    {
      id: 'memphis',
      name: 'Memphis',
      description: 'Bold & playful',
      gradient: ['#43e97b', '#38f9d7'],
      preview: RoomStyleImages.Memphis,
    },
    {
      id: 'eclectic',
      name: 'Eclectic',
      description: 'Mixed & creative',
      gradient: ['#ff6b6b', '#feca57'],
      preview: RoomStyleImages.Eclectic,
    },
  ];

  const roomOptions: RoomOption[] = [
    { id: 'living-room', name: 'Living Room' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'dining-room', name: 'Dining Room' },
    { id: 'bathroom', name: 'Bathroom' },
    { id: 'home-office', name: 'Home Office' },
    { id: 'outdoor-space', name: 'Outdoor Space' },
    { id: 'baby-kids-room', name: 'Baby & Kids Room' },
    { id: 'closet', name: 'Closet' },
    { id: 'store', name: 'Store' },
    { id: 'home-cinema', name: 'Home Cinema' },
    { id: 'cafe-bar', name: 'Cafe & Bar' },
    { id: 'garage', name: 'Garage' },
    { id: 'hallway', name: 'Hallway' },
    { id: 'gym', name: 'Gym' },
    { id: 'laundry-room', name: 'Laundry Room' },
    { id: 'reception-area', name: 'Reception Area' },
    { id: 'office', name: 'Office' },
  ];

  const qualityOptions = ['SD', 'HD', '4K'];

  const handleStyleSelect = (styleId: string) => {
    Haptics.selectionAsync();
    setSelectedStyle(styleId);
    setShowStyleDropdown(false);
  };

  const handleRoomSelect = (roomId: string) => {
    Haptics.selectionAsync();
    setSelectedRoom(roomId);
    setShowRoomDropdown(false);
  };

  const handleQualitySelect = (quality: string) => {
    Haptics.selectionAsync();
    setSelectedQuality(quality);
  };

  const handleRestyleWithAI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const selectedStyleData = styleOptions.find(s => s.id === selectedStyle);
    
    // Navigate to Preview with the selected options
    navigation.navigate('Preview', {
      imageUri,
      mode: 'clean',
      confirmedStyle: selectedStyleData?.name || 'Contemporary',
      roomType: selectedRoom,
      quality: selectedQuality,
      additionalPrompt: additionalPrompt.trim(),
    });
  };

  const getSelectedRoomName = () => {
    return roomOptions.find(r => r.id === selectedRoom)?.name || 'Living Room';
  };

  const getSelectedStyleName = () => {
    return styleOptions.find(s => s.id === selectedStyle)?.name || 'Contemporary';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRight} />
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsRow}>
          {/* Room Type Dropdown */}
          <TouchableOpacity
            style={styles.blackContainer}
            onPress={() => setShowRoomDropdown(true)}
          >
            <Text style={styles.containerLabel}>Room type</Text>
            <View style={styles.containerContent}>
              <Text style={styles.containerText} numberOfLines={1}>{getSelectedRoomName()}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Style Dropdown */}
          <TouchableOpacity
            style={styles.blackContainer}
            onPress={() => setShowStyleDropdown(true)}
          >
            <Text style={styles.containerLabel}>Style</Text>
            <View style={styles.containerContent}>
              <Text style={styles.containerText} numberOfLines={1}>{getSelectedStyleName()}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Settings Icon */}
          <TouchableOpacity
            style={styles.settingsContainer}
            onPress={() => setShowSettingsModal(true)}
          >
            <MaterialIcons name="settings" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
      </View>

      {/* Upstyle Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.restyleButton}
          onPress={handleRestyleWithAI}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#E3A75B', '#7C5C3E']}
            style={styles.restyleGradient}
          >
            <MaterialIcons name="auto-fix-high" size={20} color="#FFFFFF" />
            <Text style={styles.restyleButtonText}>Upstyle</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Style Dropdown Modal with Carousel */}
      <Modal
        visible={showStyleDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStyleDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.styleModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Style</Text>
              <TouchableOpacity onPress={() => setShowStyleDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#7C5C3E" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.styleCarouselContainer}
              style={styles.styleCarousel}
            >
              {styleOptions.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCarouselCard,
                    selectedStyle === style.id && styles.styleCarouselCardSelected,
                  ]}
                  onPress={() => handleStyleSelect(style.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={style.preview}
                    style={styles.styleCarouselImage}
                    resizeMode="cover"
                  />
                  <View style={styles.styleCarouselOverlay}>
                    <Text style={styles.styleCarouselName}>{style.name}</Text>
                    <Text style={styles.styleCarouselDescription}>{style.description}</Text>
                    
                    {selectedStyle === style.id && (
                      <View style={styles.selectedIndicator}>
                        <MaterialIcons name="check" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Room Dropdown Modal */}
      <Modal
        visible={showRoomDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoomDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoomDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.roomModalTitle}>Room type</Text>
            <ScrollView 
              style={styles.roomOptionsScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.roomOptionsContent}
            >
              {roomOptions.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.modalOption,
                    selectedRoom === room.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleRoomSelect(room.id)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedRoom === room.id && styles.modalOptionTextSelected,
                  ]}>
                    {room.name}
                  </Text>
                  {selectedRoom === room.id && (
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <View style={styles.settingsDropdown}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <MaterialIcons name="close" size={24} color="#7C5C3E" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.settingsContent}>
              {/* Quality Selection */}
              <View style={styles.settingsGroup}>
                <Text style={styles.settingsLabel}>Quality</Text>
                <View style={styles.qualityOptions}>
                  {qualityOptions.map((quality) => (
                    <TouchableOpacity
                      key={quality}
                      style={[
                        styles.qualityOption,
                        selectedQuality === quality && styles.qualityOptionSelected,
                      ]}
                      onPress={() => handleQualitySelect(quality)}
                    >
                      <Text style={[
                        styles.qualityOptionText,
                        selectedQuality === quality && styles.qualityOptionTextSelected,
                      ]}>
                        {quality}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Additional Prompt */}
              <View style={styles.settingsGroup}>
                <Text style={styles.settingsLabel}>Additional prompt (optional)</Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Describe specific details you want..."
                  value={additionalPrompt}
                  onChangeText={setAdditionalPrompt}
                  placeholderTextColor="#999999"
                  multiline
                  maxLength={200}
                />
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  controlsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blackContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  containerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 2,
  },
  containerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 4,
  },
  settingsContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  restyleButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  restyleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  restyleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120,
  },
  styleModal: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  styleCarouselContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
    alignItems: 'center',
  },
  styleCarousel: {
    marginHorizontal: -20,
  },
  styleCarouselCard: {
    width: 120,
    height: 120,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCarouselCardSelected: {
    borderColor: '#7C5C3E',
  },
  styleCarouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  styleCarouselOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  styleCarouselName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  styleCarouselDescription: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    width: width * 0.8,
    maxHeight: height * 0.6,
  },
  roomModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#7C5C3E',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  modalOptionTextSelected: {
    color: '#FFFFFF',
  },
  settingsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.5,
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsContent: {
    maxHeight: height * 0.3,
  },
  settingsGroup: {
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  qualityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: '#7C5C3E',
  },
  qualityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  qualityOptionTextSelected: {
    color: '#FFFFFF',
  },
  promptInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  roomOptionsScrollView: {
    maxHeight: height * 0.4,
    marginTop: 10,
  },
  roomOptionsContent: {
    paddingBottom: 10,
  },
});

export default EditCanvasScreen; 