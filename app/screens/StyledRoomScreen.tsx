import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';

const { width: screenWidth } = Dimensions.get('window');

type StyledRoomScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StyledRoom'
>;

type StyledRoomScreenRouteProp = RouteProp<
  RootStackParamList,
  'StyledRoom'
>;

const StyledRoomScreen = () => {
  const navigation = useNavigation<StyledRoomScreenNavigationProp>();
  const route = useRoute<StyledRoomScreenRouteProp>();
  const { 
    originalImageUri, 
    styledRoomUrl, 
    styleLabel,
    autoRoute = false
  } = route.params;

  // Debug logging
  console.log('[StyledRoomScreen] Route params:', {
    originalImageUri: originalImageUri ? originalImageUri.substring(0, 50) + '...' : 'undefined',
    styledRoomUrl: styledRoomUrl ? styledRoomUrl.substring(0, 50) + '...' : 'undefined',
    styleLabel,
    autoRoute
  });

  // Validate URLs
  const isValidUrl = (url: string) => {
    try {
      return url && (url.startsWith('http') || url.startsWith('file://') || url.startsWith('ph://'));
    } catch {
      return false;
    }
  };

  console.log('[StyledRoomScreen] URL validation:', {
    originalValid: isValidUrl(originalImageUri),
    styledValid: isValidUrl(styledRoomUrl),
    originalUrl: originalImageUri,
    styledUrl: styledRoomUrl
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [styledImageLoaded, setStyledImageLoaded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  
  // Style options for the carousel
  const styleOptions = [
    { id: 'contemporary', name: 'Contemporary', preview: require('../assets/room-style/Contemporary.png') },
    { id: 'scandinavian', name: 'Scandinavian', preview: require('../assets/room-style/Scandinavian.png') },
    { id: 'industrial', name: 'Industrial', preview: require('../assets/room-style/Industrial.png') },
    { id: 'bohemian', name: 'Bohemian', preview: require('../assets/room-style/Boho.png') },
    { id: 'mid-century-modern', name: 'Mid-Century', preview: require('../assets/room-style/Mid-Century Modern.png') },
    { id: 'classic', name: 'Classic', preview: require('../assets/room-style/Classic.png') },
    { id: 'farmhouse', name: 'Farmhouse', preview: require('../assets/room-style/Farmhouse.png') },
    { id: 'coastal', name: 'Coastal', preview: require('../assets/room-style/Coastal.png') },
  ];
  
  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const handleApplyStyle = useCallback(() => {
    if (!selectedStyle) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStyleModal(false);
    
    // Navigate back to EditCanvas with new style parameters
    navigation.navigate('EditCanvas', {
      imageUri: originalImageUri,
      source: 'styled',
      selectedStyle: selectedStyle.id,
      additionalPrompt
    });
  }, [selectedStyle, additionalPrompt, originalImageUri, navigation]);
  
  // Animation for before/after slider
  const sliderPosition = useRef(new Animated.Value(screenWidth / 2)).current;
  const [sliderValue, setSliderValue] = useState(0.5); // 0 = original, 1 = styled

  useEffect(() => {
    console.log('[StyledRoomScreen] Image load state:', { imageLoaded, styledImageLoaded });
    // Auto-show comparison when both images are loaded
    if (imageLoaded && styledImageLoaded) {
      console.log('[StyledRoomScreen] Both images loaded, showing comparison in 500ms');
      setTimeout(() => setShowComparison(true), 500);
    }
  }, [imageLoaded, styledImageLoaded]);

  // Fallback timeout to force show comparison if images are taking too long
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log('[StyledRoomScreen] Fallback timer - forcing image load states');
      if (!imageLoaded) {
        console.log('[StyledRoomScreen] Forcing original image as loaded');
        setImageLoaded(true);
      }
      if (!styledImageLoaded) {
        console.log('[StyledRoomScreen] Forcing styled image as loaded');
        setStyledImageLoaded(true);
      }
    }, 3000); // 3 second fallback

    return () => clearTimeout(fallbackTimer);
  }, [imageLoaded, styledImageLoaded]);

  // Auto-route to My Photos after 2 seconds when both images are loaded (only for new processing results)
  useEffect(() => {
    if (autoRoute && imageLoaded && styledImageLoaded && showComparison) {
      console.log('[StyledRoomScreen] Auto-routing to My Photos in 2 seconds...');
      const timer = setTimeout(() => {
        // Navigate to Dashboard and ensure we're on the Rooms tab which contains "My Photos"
        navigation.navigate('Dashboard', { 
          screen: 'Rooms',
          params: { 
            initialTab: 'projects' // Navigate to "My Photos" tab within RoomsScreen
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    } else if (!autoRoute) {
      console.log('[StyledRoomScreen] Auto-route disabled - user is viewing existing photo');
    }
  }, [autoRoute, imageLoaded, styledImageLoaded, showComparison, navigation]);

  const handleImageLoad = useCallback(() => {
    console.log('[StyledRoomScreen] Original image loaded');
    setImageLoaded(true);
  }, []);

  const handleStyledImageLoad = useCallback(() => {
    console.log('[StyledRoomScreen] Styled image loaded');
    setStyledImageLoaded(true);
  }, []);

  const handleSavePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to My Photos with auto-route to show saved photo
    navigation.navigate('Dashboard', {
      screen: 'Rooms',
      params: { initialTab: 'projects' }
    });
  }, [navigation]);

  const handleTryDifferentStyle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStyleModal(true);
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setSliderValue(clampedValue);
    Animated.timing(sliderPosition, {
      toValue: clampedValue * screenWidth,
      duration: 0,
      useNativeDriver: false,
    }).start();
  }, [sliderPosition]);

  // Create PanResponder for slider
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Handle initial touch
        const { locationX } = evt.nativeEvent;
        const containerOffset = 40; // Account for margin/padding
        const availableWidth = screenWidth - containerOffset * 2;
        const normalizedX = Math.max(0, Math.min(availableWidth, locationX));
        const value = normalizedX / availableWidth;
        handleSliderChange(value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { locationX } = evt.nativeEvent;
        const containerOffset = 40; // Account for margin/padding
        const availableWidth = screenWidth - containerOffset * 2;
        const normalizedX = Math.max(0, Math.min(availableWidth, locationX));
        const value = normalizedX / availableWidth;
        handleSliderChange(value);
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    })
  ).current;

  const toggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = sliderValue < 0.5 ? 1 : 0;
    setSliderValue(newValue);
    
    Animated.spring(sliderPosition, {
      toValue: newValue * screenWidth,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [sliderValue, sliderPosition]);

  const getCurrentLabel = () => {
    if (sliderValue < 0.5) {
      return 'Original Room';
    } else {
      return `${styleLabel} Style`;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.innerContainer}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#7C5C3E" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
        </View>

        {/* Image Comparison Container */}
        <View style={styles.imageSection}>
          <View 
            style={styles.imageContainer}
            {...panResponder.panHandlers}
          >
            
            {/* Loading State */}
            {(!imageLoaded || !styledImageLoaded) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C5C3E" />
                <Text style={styles.loadingText}>
                  {!imageLoaded ? 'Loading original image...' : !styledImageLoaded ? 'Loading styled image...' : 'Processing...'}
                </Text>
                {__DEV__ && (
                  <Text style={[styles.loadingText, { fontSize: 10, marginTop: 8 }]}>
                    Original: {imageLoaded ? '✅' : '⏳'} | Styled: {styledImageLoaded ? '✅' : '⏳'}
                  </Text>
                )}
              </View>
            )}

            {/* Original Image (Background) */}
            <Image 
              source={{ uri: originalImageUri }} 
              style={[styles.image, !imageLoaded && styles.hiddenImage]}
              resizeMode="cover"
              onLoad={handleImageLoad}
              onError={() => {
                console.error('Failed to load original image:', originalImageUri);
                setImageLoaded(true);
              }}
            />

            {/* Styled Image (Overlay with mask) */}
            {showComparison && (
              <Animated.View 
                style={[
                  styles.styledImageContainer,
                  {
                    width: sliderPosition,
                  }
                ]}
              >
                <Image 
                  source={{ uri: styledRoomUrl }} 
                  style={[styles.image, !styledImageLoaded && styles.hiddenImage]}
                  resizeMode="cover"
                  onLoad={handleStyledImageLoad}
                  onError={(error) => {
                    console.error('Failed to load styled image:', styledRoomUrl, error);
                    console.error('Error details:', error.nativeEvent);
                    setStyledImageLoaded(true);
                  }}
                />
              </Animated.View>
            )}

            {/* Slider Handle */}
            {showComparison && (
              <Animated.View 
                style={[
                  styles.sliderHandle,
                  {
                    left: sliderPosition,
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.sliderLine} />
                <View style={styles.sliderButton}>
                  <MaterialIcons name="drag-handle" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.sliderLine} />
              </Animated.View>
            )}

            {/* Labels */}
            {showComparison && (
              <>
                <View style={styles.beforeLabel}>
                  <Text style={styles.labelText}>BEFORE</Text>
                </View>
                <View style={styles.afterLabel}>
                  <Text style={styles.labelText}>AFTER</Text>
                </View>
              </>
            )}
            
            {/* Tap zone for quick toggle */}
            {showComparison && (
              <TouchableOpacity 
                style={styles.tapZone}
                onPress={toggleView}
                activeOpacity={1}
              />
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleTryDifferentStyle}
          >
            <MaterialIcons name="palette" size={20} color="#7C5C3E" />
            <Text style={styles.secondaryButtonText}>Change Style</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSavePhoto}
          >
            <MaterialIcons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Save Photo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Style Selection Modal */}
        <Modal
          visible={showStyleModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStyleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Style</Text>
                <TouchableOpacity onPress={() => setShowStyleModal(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleCarousel}>
                {styleOptions.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.styleOption,
                      selectedStyle?.id === style.id && styles.selectedStyleOption
                    ]}
                    onPress={() => handleStyleSelect(style)}
                  >
                                          <Image source={style.preview} style={styles.stylePreview} />
                    <Text style={styles.styleName}>{style.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.promptSection}>
                <Text style={styles.promptLabel}>Additional Details (Optional)</Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="e.g., add plants, warmer lighting, minimalist furniture"
                  placeholderTextColor="#999999"
                  value={additionalPrompt}
                  onChangeText={setAdditionalPrompt}
                  multiline
                  maxLength={200}
                />
              </View>
              
              <TouchableOpacity style={styles.applyStyleButton} onPress={handleApplyStyle}>
                <Text style={styles.applyStyleText}>Apply Style</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  comparisonSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 8,
  },
  toggleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
  },
  toggleHintText: {
    fontSize: 12,
    color: '#7C5C3E',
    marginLeft: 6,
  },
  imageSection: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hiddenImage: {
    opacity: 0,
  },
  styledImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -2 }],
  },
  sliderLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  beforeLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  afterLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(124, 92, 62, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7C5C3E',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#7C5C3E',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  styleCarousel: {
    paddingVertical: 20,
  },
  styleOption: {
    marginLeft: 12,
    width: 100,
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
  },
      selectedStyleOption: {
      backgroundColor: '#F0F8FF',
      borderWidth: 2,
      borderColor: '#7C5C3E',
    },
    stylePreview: {
      width: 100,
      height: 100,
      borderRadius: 0,
      marginBottom: 4,
    },
  styleName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  promptSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
  },
  applyStyleButton: {
    marginHorizontal: 20,
    backgroundColor: '#7C5C3E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyStyleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default StyledRoomScreen; 