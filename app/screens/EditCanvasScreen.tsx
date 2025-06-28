import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useImageProcessing } from '../hooks/useImageProcessing';
import { DesignStyle } from '../services/styleService';

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
  const { imageUri, source, existingEmptyUrl, mode = 'unified', roomType } = route.params;

  // Local state for UI
  const [selectedStyle, setSelectedStyle] = useState('contemporary');
  const [selectedRoom, setSelectedRoom] = useState(roomType || 'living-room');
  const [selectedQuality, setSelectedQuality] = useState('HD');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  // Processing state using the existing hook
  const { state: processingState, actions: processingActions } = useImageProcessing(
    imageUri, 
    'simple', // Use simplified processing with new n8n workflow
    selectedRoom,
    selectedStyle,
    selectedQuality,
    additionalPrompt
  );
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [styleRetryCount, setStyleRetryCount] = useState(0);
  const MAX_STYLE_RETRIES = 2;

  // Style options mapping to DesignStyle
  const styleOptionsMapping = {
    'contemporary': 'modern' as DesignStyle,
    'scandinavian': 'scandinavian' as DesignStyle,
    'industrial': 'industrial' as DesignStyle,
    'bohemian': 'bohemian' as DesignStyle,
    'traditional': 'minimal' as DesignStyle,
    'mid-century-modern': 'modern' as DesignStyle,
    'transitional': 'modern' as DesignStyle,
    'farmhouse': 'minimal' as DesignStyle,
    'mediterranean': 'botanical' as DesignStyle,
    'asian': 'botanical' as DesignStyle,
    'oriental': 'botanical' as DesignStyle,
    'serene-zen': 'botanical' as DesignStyle,
    'wabi-sabi': 'minimal' as DesignStyle,
    'rustic-log-cabin': 'minimal' as DesignStyle,
    'shabby-chic': 'minimal' as DesignStyle,
    'craftsman': 'minimal' as DesignStyle,
    'victorian-elegance': 'minimal' as DesignStyle,
    'coastal': 'scandinavian' as DesignStyle,
    'tropical': 'botanical' as DesignStyle,
    'southwestern': 'bohemian' as DesignStyle,
    'retro-1970s': 'bohemian' as DesignStyle,
    '1960s-retro': 'bohemian' as DesignStyle,
    'memphis': 'modern' as DesignStyle,
    'eclectic': 'bohemian' as DesignStyle,
  };

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Show style selection when empty room is ready - DISABLED for unified workflow
  useEffect(() => {
    console.log('[EditCanvasScreen] Auto-style application disabled - using unified processing workflow');
    // Unified workflow handles both empty room creation and styling in one step
    // No need for separate style application
    return;
    
    /* DISABLED - Auto-style application not needed with unified workflow
    if (processingState.stage === 'styling' && !processingState.loading && processingState.emptyRoomUrl) {
      // Check if we have a webhook error and have already retried
      if (processingState.error && processingState.error.includes('webhook') && styleRetryCount >= MAX_STYLE_RETRIES) {
        console.log('[EditCanvasScreen] Max retries reached for webhook error, stopping auto-retry');
        return;
      }
      
      console.log('[EditCanvasScreen] Empty room ready, auto-applying selected style');
      // Auto-apply the selected style instead of showing modal
      const designStyle = styleOptionsMapping[selectedStyle] || 'modern' as DesignStyle;
      setStyleRetryCount(prev => prev + 1);
      processingActions.handleStyleSelected(designStyle);
    }
    */
  }, []);

  // Handle existing empty room URL - DISABLED for unified workflow
  useEffect(() => {
    console.log('[EditCanvasScreen] Existing empty room URL handling disabled - using unified processing workflow');
    // Unified workflow handles everything in one step
    return;
    
    /* DISABLED - Existing empty room handling not needed with unified workflow
    if (existingEmptyUrl && processingState.stage === 'empty' && !processingState.emptyRoomUrl) {
      // Check if we have a webhook error and have already retried
      if (processingState.error && processingState.error.includes('webhook') && styleRetryCount >= MAX_STYLE_RETRIES) {
        console.log('[EditCanvasScreen] Max retries reached for webhook error, stopping auto-retry');
        return;
      }
      
      console.log('[EditCanvasScreen] Have existing empty room URL, auto-applying selected style:', existingEmptyUrl);
      const designStyle = styleOptionsMapping[selectedStyle] || 'modern' as DesignStyle;
      setStyleRetryCount(prev => prev + 1);
      processingActions.handleStyleSelected(designStyle);
    }
    */
  }, []);

  // Handle navigation when styling is complete
  useEffect(() => {
    if (processingState.stage === 'complete') {
      console.log('[EditCanvasScreen] Processing complete, staying on canvas');
      // Stay on canvas to show the final result
    }
  }, [processingState.stage]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle retry
  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    processingActions.handleTryAgain();
  }, [processingActions]);

  // Get current display image
  const getCurrentDisplayImage = () => {
    if (processingState.stage === 'complete' && processingState.processedUrl) {
      return processingState.processedUrl;
    }
    if (processingState.stage === 'styling' && (processingState.emptyRoomUrl || existingEmptyUrl)) {
      return existingEmptyUrl || processingState.emptyRoomUrl;
    }
    if (existingEmptyUrl && processingState.stage === 'empty') {
      return existingEmptyUrl;
    }
    return imageUri;
  };

  // Get current status text
  const getCurrentStatusText = () => {
    if (processingState.error) {
      // Check if it's a webhook error and show user-friendly message
      if (processingState.error.includes('webhook') || processingState.error.includes('not registered')) {
        return 'Service temporarily unavailable. Please try again later or contact support.';
      }
      return processingState.error;
    }
    if (processingState.stage === 'complete') {
      return 'Your styled room is ready!';
    }
    if (processingState.stage === 'styling' && !processingState.loading) {
      return 'Applying your selected style...';
    }
    return processingState.processingStatus;
  };

  // Determine if we should show the original controls
  const showOriginalControls = !processingState.loading && 
                               processingState.stage === 'empty' && 
                               !processingState.emptyRoomUrl && 
                               !existingEmptyUrl;

  // Determine if we should show processing overlay
  const showProcessingOverlay = processingState.loading || 
                               processingState.stage !== 'empty' || 
                               processingState.emptyRoomUrl ||
                               existingEmptyUrl;

  // Debug logging for button visibility
  console.log('[EditCanvasScreen] Button visibility state:', {
    showOriginalControls,
    showProcessingOverlay,
    loading: processingState.loading,
    stage: processingState.stage,
    emptyRoomUrl: processingState.emptyRoomUrl ? 'present' : 'null',
    existingEmptyUrl: existingEmptyUrl ? 'present' : 'null'
  });

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

  const handleRestyleWithAI = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Prevent multiple triggers
    if (processingState.loading) {
      console.log('[EditCanvasScreen] Already processing, ignoring duplicate trigger');
      return;
    }
    
    // Start the processing workflow using the image processing hook
    console.log('[EditCanvasScreen] Start Processing button pressed');
    console.log('[EditCanvasScreen] Current processing state:', {
      loading: processingState.loading,
      stage: processingState.stage,
      error: processingState.error
    });
    
    try {
      // Use the image processing hook instead of WorkflowIntegration
      await processingActions.startProcessing();
      console.log('[EditCanvasScreen] Processing started successfully');
      
    } catch (error) {
      console.error('[EditCanvasScreen] Error starting processing:', error);
      
      // Show error alert
      Alert.alert(
        'Processing Error',
        'Failed to start image processing. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {processingState.stage === 'complete' ? 'Styled Room' : 
           processingState.stage === 'styling' ? 'Style Selection' : 'Room Canvas'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Controls Section - Only show when not processing */}
      {showOriginalControls && (
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
      )}

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: getCurrentDisplayImage() }} 
          style={styles.previewImage} 
          resizeMode="contain"
          onLoad={handleImageLoad}
        />
        
        {/* Processing Overlay */}
        {showProcessingOverlay && processingState.loading && (
          <View style={styles.processingOverlay}>
            {/* Just darken the screen, no loading indicators */}
          </View>
        )}
        
        {/* Error Overlay - only show when there's an error */}
        {showProcessingOverlay && processingState.error && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <MaterialIcons name="error" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{processingState.error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Action Button */}
      {showOriginalControls && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restyleButton}
            onPress={handleRestyleWithAI}
            disabled={processingState.loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E3A75B', '#7C5C3E']}
              style={styles.restyleGradient}
            >
              <MaterialIcons name="auto-fix-high" size={20} color="#FFFFFF" />
              <Text style={styles.restyleButtonText}>
                {processingState.loading ? 'Transforming Room...' : 'Transform Room'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

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
        <KeyboardAvoidingView 
          style={styles.settingsModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.settingsModalContent}>
            <ScrollView 
              contentContainerStyle={styles.settingsScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.settingsModalTitle}>Settings</Text>
              
              {/* Quality Selection */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Quality</Text>
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
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Additional Instructions (Optional)</Text>
                <TextInput
                  style={styles.promptInput}
                  value={additionalPrompt}
                  onChangeText={setAdditionalPrompt}
                  placeholder="Add specific details about your desired style..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.settingsCloseButton}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.settingsCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  },
  restyleButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  restyleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  restyleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  styleModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  styleCarousel: {
    paddingLeft: 20,
  },
  styleCarouselContainer: {
    paddingRight: 20,
  },
  styleCarouselCard: {
    width: 200,
    height: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  styleCarouselCardSelected: {
    borderWidth: 3,
    borderColor: '#7C5C3E',
  },
  styleCarouselImage: {
    width: '100%',
    height: '70%',
  },
  styleCarouselOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  styleCarouselName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  styleCarouselDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: height * 0.6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  roomModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
    padding: 20,
    paddingBottom: 10,
  },
  roomOptionsScrollView: {
    maxHeight: height * 0.4,
  },
  roomOptionsContent: {
    paddingBottom: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#7C5C3E',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  settingsScrollContent: {
    padding: 20,
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 20,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  qualityOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: '#7C5C3E',
    borderColor: '#7C5C3E',
  },
  qualityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qualityOptionTextSelected: {
    color: '#FFFFFF',
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  settingsCloseButton: {
    backgroundColor: '#7C5C3E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  settingsCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  styleSelectionModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleSelectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.95,
    maxHeight: height * 0.8,
  },
  styleSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C5C3E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7C5C3E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default EditCanvasScreen; 