import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { DesignStyle } from '../services/styleService';

const { width, height } = Dimensions.get('window');

// Beautiful room styles with enhanced data
const ROOM_STYLES = [
  {
    id: 'contemporary',
    title: 'Contemporary',
    subtitle: 'Current & Sophisticated',
    description: 'Current design trends with clean lines and sophisticated aesthetics',
    color: '#F8F9FA',
    accentColor: '#6C757D',
    gradient: ['#F8F9FA', '#E9ECEF'],
    icon: '○',
  },
  {
    id: 'classic',
    title: 'Classic',
    subtitle: 'Timeless & Elegant',
    description: 'Traditional elegance with refined details and quality craftsmanship',
    color: '#F8F6F0',
    accentColor: '#8B4513',
    gradient: ['#F8F6F0', '#F0E6D2'],
    icon: '◆',
  },
  {
    id: 'mid-century-modern',
    title: 'Mid-Century Modern',
    subtitle: 'Retro & Iconic',
    description: 'Iconic 1950s-60s design with clean lines and functional beauty',
    color: '#FFF8E1',
    accentColor: '#FF8F00',
    gradient: ['#FFF8E1', '#FFECB3'],
    icon: '□',
  },
  {
    id: 'boho',
    title: 'Boho',
    subtitle: 'Eclectic & Warm',
    description: 'Rich textures, vibrant colors, and global influences',
    color: '#FFF3E0',
    accentColor: '#F57C00',
    gradient: ['#FFF3E0', '#FFE0B2'],
    icon: '◇',
  },
  {
    id: 'scandinavian',
    title: 'Scandinavian',
    subtitle: 'Light & Airy',
    description: 'Nordic simplicity with functional beauty and natural materials',
    color: '#F3E5F5',
    accentColor: '#7B1FA2',
    gradient: ['#F3E5F5', '#E1BEE7'],
    icon: '△',
  },
  {
    id: 'industrial',
    title: 'Industrial',
    subtitle: 'Raw & Edgy',
    description: 'Urban aesthetics with exposed materials and bold statements',
    color: '#EFEBE9',
    accentColor: '#5D4037',
    gradient: ['#EFEBE9', '#D7CCC8'],
    icon: '⬟',
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean',
    subtitle: 'Warm & Coastal',
    description: 'Warm coastal style inspired by the Mediterranean region',
    color: '#FFF4E6',
    accentColor: '#D2691E',
    gradient: ['#FFF4E6', '#FFE4B5'],
    icon: '☀',
  },
  {
    id: 'tropical',
    title: 'Tropical',
    subtitle: 'Natural & Fresh',
    description: 'Bring paradise indoors with tropical plants and natural elements',
    color: '#E8F5E8',
    accentColor: '#388E3C',
    gradient: ['#E8F5E8', '#C8E6C9'],
    icon: '🌿',
  },
];

const PROCESSING_STAGES = [
  { message: 'Analyzing room dimensions...', duration: 3000 },
  { message: 'Identifying architectural features...', duration: 2500 },
  { message: 'Detecting lighting conditions...', duration: 2000 },
  { message: 'Please select your preferred style...', duration: 0 }, // Wait for user selection
  { message: 'Applying design elements...', duration: 2500 },
  { message: 'Optimizing furniture placement...', duration: 2000 },
  { message: 'Adding finishing touches...', duration: 1500 },
  { message: 'Finalizing your design...', duration: 1000 },
];

/**
 * Beautiful and engaging style selection demo with modern UI
 */
const StyleSelectionDemo = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const styleCardsAnim = useRef(ROOM_STYLES.map(() => new Animated.Value(0))).current;
  
  // Initialize animations
  useEffect(() => {
    if (loading) {
      // Fade in the loading screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate style cards in sequence
      ROOM_STYLES.forEach((_, index) => {
        setTimeout(() => {
          Animated.spring(styleCardsAnim[index], {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }, 1000 + index * 150);
      });
    }
  }, [loading]);
  
  // Handle processing stages
  useEffect(() => {
    if (!loading) return;
    
    const stage = PROCESSING_STAGES[currentStage];
    if (!stage) return;
    
    // If we're at the style selection stage and no style selected, wait
    if (currentStage === 3 && !selectedStyle) {
      return;
    }
    
    // Animate progress
    const targetProgress = ((currentStage + 1) / PROCESSING_STAGES.length) * 100;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    setProcessingProgress(targetProgress);
    
    // Move to next stage after duration (unless waiting for selection)
    if (stage.duration > 0) {
      const timer = setTimeout(() => {
        if (currentStage < PROCESSING_STAGES.length - 1) {
          setCurrentStage(currentStage + 1);
        } else {
          // Processing complete
          setTimeout(() => {
            setLoading(false);
            setShowResult(true);
          }, 1000);
        }
      }, stage.duration);
      
      return () => clearTimeout(timer);
    }
  }, [currentStage, selectedStyle, loading]);
  
  // Handle style selection
  const handleStyleSelected = (styleId: DesignStyle) => {
    if (selectedStyle === styleId) return;
    
    setSelectedStyle(styleId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Continue processing after selection
    if (currentStage === 3) {
      setTimeout(() => {
        setCurrentStage(4);
      }, 800);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };
  
  // Restart the demo
  const handleRestartDemo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStyle(null);
    setShowResult(false);
    setCurrentStage(0);
    setProcessingProgress(0);
    setLoading(true);
    
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    progressAnim.setValue(0);
    styleCardsAnim.forEach(anim => anim.setValue(0));
  };
  
  const currentMessage = PROCESSING_STAGES[currentStage]?.message || 'Processing...';
  const selectedStyleData = ROOM_STYLES.find(style => style.id === selectedStyle);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Style Selection</Text>
          <Text style={styles.headerSubtitle}>Create your perfect room</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
      {showResult ? (
        // Result Screen
        <View style={styles.resultContainer}>
          <Animated.View style={[styles.resultContent, { opacity: fadeAnim }]}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✨</Text>
            </View>
            <Text style={styles.resultTitle}>Design Complete!</Text>
            <Text style={styles.resultDescription}>
              Your room has been beautifully transformed with the{' '}
              <Text style={[styles.styleHighlight, { color: selectedStyleData?.accentColor }]}>
                {selectedStyleData?.title}
              </Text>{' '}
              style.
            </Text>
            
            <View style={styles.resultImageContainer}>
              <Image 
                source={require('../assets/emptyroom.png')} 
                style={styles.resultImage} 
                resizeMode="contain"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.restartButton, { backgroundColor: selectedStyleData?.accentColor }]} 
              onPress={handleRestartDemo}
            >
              <Text style={styles.restartButtonText}>Try Another Style</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        // Loading Screen with Style Selection
        <Animated.View 
          style={[
            styles.loadingContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Progress Header */}
          <View style={styles.progressSection}>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>Designing Your Space</Text>
              <Text style={styles.progressMessage}>{currentMessage}</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                      backgroundColor: selectedStyleData?.accentColor || '#7C5C3E',
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(processingProgress)}%</Text>
            </View>
          </View>
          
          {/* Room Preview */}
          <View style={styles.roomPreviewContainer}>
            <Image 
              source={require('../assets/emptyroom.png')} 
              style={styles.roomPreviewImage} 
              resizeMode="contain"
            />
            {selectedStyle && (
              <View style={[styles.roomOverlay, { backgroundColor: selectedStyleData?.color }]} />
            )}
          </View>
          
          {/* Style Selection Grid */}
          <View style={styles.styleSelectionContainer}>
            <Text style={styles.sectionTitle}>Choose Your Style</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.styleScrollContainer}
            >
              {ROOM_STYLES.map((style, index) => (
                <Animated.View
                  key={style.id}
                  style={[
                    styles.styleCardContainer,
                    {
                      opacity: styleCardsAnim[index],
                      transform: [{
                        scale: styleCardsAnim[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.styleCard,
                      {
                        borderColor: selectedStyle === style.id ? style.accentColor : 'transparent',
                        borderWidth: selectedStyle === style.id ? 3 : 1,
                      }
                    ]}
                    onPress={() => handleStyleSelected(style.id as DesignStyle)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.styleCardHeader, { backgroundColor: style.color }]}>
                      <Text style={styles.styleIcon}>{style.icon}</Text>
                    </View>
                    <View style={styles.styleCardContent}>
                      <Text style={styles.styleTitle}>{style.title}</Text>
                      <Text style={styles.styleSubtitle}>{style.subtitle}</Text>
                      <Text style={styles.styleDescription}>{style.description}</Text>
                    </View>
                    {selectedStyle === style.id && (
                      <View style={[styles.selectedBadge, { backgroundColor: style.accentColor }]}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSection: {
    paddingVertical: 24,
  },
  progressTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  roomPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  roomPreviewImage: {
    width: '100%',
    height: '100%',
    maxHeight: 200,
  },
  roomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    borderRadius: 12,
  },
  styleSelectionContainer: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  styleScrollContainer: {
    paddingHorizontal: 10,
  },
  styleCardContainer: {
    marginHorizontal: 8,
  },
  styleCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    position: 'relative',
  },
  styleCardHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleIcon: {
    fontSize: 32,
    color: '#666',
  },
  styleCardContent: {
    padding: 16,
  },
  styleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  styleSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  styleDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 36,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  styleHighlight: {
    fontWeight: 'bold',
  },
  resultImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 32,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  restartButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StyleSelectionDemo; 