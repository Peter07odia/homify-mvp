import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ImageComparisonProps {
  originalUrl: string;
  processedUrl: string;
  mode: 'empty' | 'clean';
  onRedo: () => void;
  onComplete: () => void;
  downloadingImage: boolean;
  imageAspectRatio: number;
  onImageLoad: (uri: string) => void;
  imageLoaded: boolean;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalUrl,
  processedUrl,
  mode,
  onRedo,
  onComplete,
  downloadingImage,
  imageAspectRatio,
  onImageLoad,
  imageLoaded,
}) => {
  const [sliderValue, setSliderValue] = useState(0.5);

  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
    if (value % 0.1 < 0.01 || value % 0.1 > 0.99) {
      Haptics.selectionAsync();
    }
  }, []);

  // Create safe local copies of the URLs to prevent accessing freed memory
  const safeOriginalUrl = originalUrl;
  const safeProcessedUrl = processedUrl;
  
  // Calculate image container dimensions based on aspect ratio
  const containerWidth = width - 40;
  let containerHeight = containerWidth;
  
  // If we have a valid aspect ratio, use it to calculate height
  if (imageLoaded && imageAspectRatio) {
    containerHeight = containerWidth / imageAspectRatio;
  }

  return (
    <View style={styles.comparisonContainer}>
      <View 
        style={[
          styles.imageContainer, 
          { 
            width: containerWidth, 
            height: containerHeight 
          }
        ]}
      >
        {/* Original image (background) */}
        <Image 
          source={{ uri: safeOriginalUrl }} 
          style={styles.fullImage} 
          resizeMode="cover" 
          onLoad={() => !imageLoaded && onImageLoad(safeOriginalUrl)}
          onError={() => {
            console.error('Failed to load original image');
          }}
        />
        
        {/* Processed image (overlay with mask) */}
        <View 
          style={[
            styles.processedImageContainer, 
            { width: containerWidth * sliderValue }
          ]}
        >
          <Image 
            source={{ uri: safeProcessedUrl }} 
            style={[
              styles.processedImage,
              { width: containerWidth }
            ]} 
            resizeMode="cover"
            onError={() => {
              console.error('Failed to load processed image');
            }}
          />
        </View>
        
        {/* Slider divider */}
        <View 
          style={[
            styles.sliderDivider, 
            { left: containerWidth * sliderValue }
          ]}
        >
          <View style={styles.sliderDividerLine} />
          <View style={styles.sliderDividerHandle}>
            <MaterialIcons name="compare-arrows" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.sliderDividerLine} />
        </View>
      </View>
      
      {/* Labels and slider control */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabelContainer}>
          <Text style={styles.sliderLabelText}>Original</Text>
          <Text style={styles.sliderLabelText}>
            {mode === 'empty' ? 'Empty' : 'Decluttered'}
          </Text>
        </View>
        
        <Slider
          style={styles.slider}
          value={sliderValue}
          onValueChange={handleSliderChange}
          minimumValue={0.05}
          maximumValue={0.95}
          minimumTrackTintColor="#E0D5C9"
          maximumTrackTintColor="#7C5C3E"
          thumbTintColor="#7C5C3E"
        />
      </View>
      
      {/* Caption */}
      <Text style={styles.captionText}>
        Slide to compare {mode === 'empty' ? 'original and empty room' : 'before and after'}
      </Text>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onRedo}
          disabled={downloadingImage}
        >
          <MaterialIcons name="replay" size={24} color="#7C5C3E" />
          <Text style={styles.actionButtonText}>Redo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryActionButton]}
          onPress={onComplete}
          disabled={downloadingImage}
        >
          <MaterialIcons name="check" size={24} color="#FFFFFF" />
          <Text style={styles.primaryActionButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  comparisonContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  processedImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  processedImage: {
    height: '100%',
  },
  sliderDivider: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderDividerLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  sliderDividerHandle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C5C3E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  sliderContainer: {
    width: '90%',
    marginTop: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  captionText: {
    fontSize: 14,
    color: '#8B7E74',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginHorizontal: 8,
    backgroundColor: '#E0D5C9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primaryActionButton: {
    backgroundColor: '#7C5C3E',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  primaryActionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 