import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { DesignStyle } from '../services/styleService';

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

  // Use our simplified hooks
  const { state: processingState, actions: processingActions } = useImageProcessing(imageUri, mode);

  // Local state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>('minimal');

  // Style options
  const styleOptions = [
    { id: 'minimal' as DesignStyle, label: 'Classic' },
    { id: 'modern' as DesignStyle, label: 'Minimalist' },
    { id: 'botanical' as DesignStyle, label: 'Modern' },
    { id: 'scandinavian' as DesignStyle, label: 'Botanical' },
    { id: 'industrial' as DesignStyle, label: 'Industrial' },
    { id: 'bohemian' as DesignStyle, label: 'Bohemian' },
  ];

  // Handle image load
  const handleImageLoad = useCallback((uri: string) => {
    Image.getSize(uri, () => {
      setImageLoaded(true);
    }, () => {
      setImageLoaded(true);
    });
  }, []);

  // Navigation handlers - removed handleBack, added handleRedo
  const handleRedo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PhotoSelection');
  }, [navigation]);

  // Handle style selection
  const handleStyleSelect = useCallback((styleId: DesignStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyle(styleId);
    // Remove automatic workflow triggering - only update selection state
  }, []);

  // Button state logic
  const isStyleButtonEnabled = useMemo(() => {
    return !processingState.loading && 
           selectedStyle && 
           processingState.emptyRoomUrl && 
           processingState.stage === 'styling';
  }, [processingState.loading, selectedStyle, processingState.emptyRoomUrl, processingState.stage]);

  const getStyleButtonText = useMemo(() => {
    if (processingState.loading) {
      return 'Processing...';
    }
    if (!processingState.emptyRoomUrl) {
      return 'Processing empty room...';
    }
    if (!selectedStyle) {
      return 'Select a style first';
    }
    const selectedStyleOption = styleOptions.find(s => s.id === selectedStyle);
    return `Apply ${selectedStyleOption?.label} Style`;
  }, [processingState.loading, processingState.emptyRoomUrl, selectedStyle, styleOptions]);

  // Handle style application (triggered by button)
  const handleApplyStyle = useCallback(() => {
    console.log('[PreviewScreen] handleApplyStyle called with:', {
      isStyleButtonEnabled,
      selectedStyle,
      processingState: {
        loading: processingState.loading,
        stage: processingState.stage,
        emptyRoomUrl: processingState.emptyRoomUrl ? 'present' : 'null',
        jobId: processingState.jobId ? 'present' : 'null'
      }
    });
    
    if (isStyleButtonEnabled && selectedStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('[PreviewScreen] Triggering style selection:', selectedStyle);
      processingActions.handleStyleSelected(selectedStyle);
    } else {
      console.warn('[PreviewScreen] Style button not enabled or no style selected');
    }
  }, [isStyleButtonEnabled, selectedStyle, processingActions, processingState]);

  // Render content based on state
  const renderContent = () => {
    if (processingState.error) {
      // Check if this is a styling error and we can retry just the style
      const isStylingError = processingState.stage === 'styling' && 
                           processingState.emptyRoomUrl && 
                           selectedStyle;
      
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {isStylingError ? 'Style Application Failed' : 'Processing Failed'}
          </Text>
          <Text style={styles.errorMessage}>{processingState.error}</Text>
          
          <View style={styles.errorButtons}>
            {isStylingError && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryStyleButton]}
                onPress={processingActions.retryStyleOnly}
              >
                <Text style={styles.actionButtonText}>Retry This Style</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, isStylingError && styles.secondaryButton]}
              onPress={processingActions.handleTryAgain}
            >
              <Text style={[styles.actionButtonText, isStylingError && styles.secondaryButtonText]}>
                Start Over
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Main image processing view
    return (
      <View style={styles.mainContainer}>
        {/* Style Selection Section */}
        <View style={styles.topStyleSection}>
          <Text style={styles.styleSectionTitle}>Choose Your Style</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.styleCapsuleScrollContainer}
            style={styles.styleCapsuleScroll}
          >
            {styleOptions.map((style, index) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCapsule,
                  selectedStyle === style.id && styles.selectedStyleCapsule,
                  index === 0 && styles.firstCapsule,
                  index === styleOptions.length - 1 && styles.lastCapsule,
                ]}
                onPress={() => handleStyleSelect(style.id)}
              >
                <Text style={[
                  styles.styleCapsuleText,
                  selectedStyle === style.id && styles.selectedStyleCapsuleText
                ]}>
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Image Display Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {/* Original Image */}
            <Image 
              source={{ uri: imageUri }} 
              style={styles.image}
              resizeMode="contain"
              onLoad={() => handleImageLoad(imageUri)}
            />
            
            {/* Loading Overlay */}
            {processingState.loading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Creating your empty room</Text>
                  {processingState.processingStatus && (
                    <Text style={styles.loadingSubtext}>{processingState.processingStatus}</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* Empty Room Result */}
            {!processingState.loading && processingState.emptyRoomUrl && (
              <View style={styles.resultOverlay}>
                <Image 
                  source={{ uri: processingState.emptyRoomUrl }} 
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </View>
        
        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          {/* Redo Button */}
          <TouchableOpacity
            style={styles.redoButton}
            onPress={handleRedo}
          >
            <MaterialIcons name="redo" size={20} color="#7C5C3E" />
            <Text style={styles.redoButtonText}>Choose New Photo</Text>
          </TouchableOpacity>

          {/* Style Selection Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !isStyleButtonEnabled && styles.disabledButton
            ]}
            onPress={handleApplyStyle}
            disabled={!isStyleButtonEnabled}
          >
            <Text style={[
              styles.actionButtonText,
              !isStyleButtonEnabled && styles.disabledButtonText
            ]}>
              {getStyleButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useEffect(() => {
    console.log('[PreviewScreen] Mounted with:', { imageUri, mode });
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.innerContainer}>
        <StatusBar style="dark" />
        
        {/* Header - removed back button */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>
            {mode === 'empty' ? 'Empty Room' : 'Decluttered Room'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.content}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  topStyleSection: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  styleSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 15,
    textAlign: 'center',
  },
  styleCapsuleScroll: {
    flexGrow: 0,
  },
  styleCapsuleScrollContainer: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  styleCapsule: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedStyleCapsule: {
    backgroundColor: '#7C5C3E',
    borderColor: '#7C5C3E',
    shadowColor: '#7C5C3E',
    shadowOpacity: 0.3,
  },
  styleCapsuleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  selectedStyleCapsuleText: {
    color: '#FFFFFF',
  },
  firstCapsule: {
    marginLeft: 8,
  },
  lastCapsule: {
    marginRight: 8,
  },
  imageSection: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#7C5C3E',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#999999',
  },
  redoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  redoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryStyleButton: {
    backgroundColor: '#7C5C3E',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#7C5C3E',
  },
  secondaryButtonText: {
    color: '#7C5C3E',
  },
});

export default PreviewScreen; 