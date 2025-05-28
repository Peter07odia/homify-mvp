import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import StyleSelectionComponent from '../components/StyleSelectionComponent';
import AnimatedPreloader from '../components/AnimatedPreloader';
import { 
  DesignStyle, 
  setUserPreferredStyle, 
  isStyleSelectionEnabled, 
  getStyleSpecificLoadingMessages 
} from '../services/styleService';
import { ProcessingMode } from '../services/roomService';

const { width, height } = Dimensions.get('window');

interface PreviewScreenOverlayProps {
  isVisible: boolean;
  processingStatus: string;
  processingProgress: number;
  mode: ProcessingMode;
  onStyleSelected?: (styleId: DesignStyle) => void;
}

const PreviewScreenOverlay: React.FC<PreviewScreenOverlayProps> = ({
  isVisible,
  processingStatus,
  processingProgress,
  mode,
  onStyleSelected,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  // Track progress synchronously from 0-100%
  const [internalProgress, setInternalProgress] = useState(0);

  // Sync with processingProgress but ensure we start from 0 and progress smoothly
  useEffect(() => {
    if (processingProgress > internalProgress) {
      const timer = setTimeout(() => {
        setInternalProgress(prev => {
          // Make incremental steps to ensure smooth animation
          const nextProgress = Math.min(prev + 0.01, processingProgress);
          return nextProgress;
        });
      }, 50); // Small delay for smooth increments
      
      return () => clearTimeout(timer);
    }
  }, [processingProgress, internalProgress]);

  // Control visibility with animation
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  // Initialize style selection feature if enabled
  useEffect(() => {
    // Only show if the feature flag is enabled
    if (!isStyleSelectionEnabled()) return;
    
    // Set default messages
    setStatusMessages(getStyleSpecificLoadingMessages(selectedStyle, mode));
  }, [selectedStyle, mode]);

  // Cycle through loading messages
  useEffect(() => {
    if (!isVisible || statusMessages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        prevIndex >= statusMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isVisible, statusMessages]);

  // Handle style selection
  const handleStyleSelected = (styleId: DesignStyle) => {
    setSelectedStyle(styleId);
    setUserPreferredStyle(styleId);
    
    // Update loading messages based on selected style
    setStatusMessages(getStyleSpecificLoadingMessages(styleId, mode));
    
    // Call parent handler if provided
    if (onStyleSelected) {
      onStyleSelected(styleId);
    }
  };

  // Get the appropriate status message to display
  const getCurrentStatusMessage = () => {
    if (!selectedStyle) {
      return "Waiting for style selection...";
    } else if (statusMessages.length > 0) {
      return statusMessages[currentMessageIndex];
    } else {
      return processingStatus;
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isStyleSelectionEnabled() ? (
          <View style={styles.content}>
            {/* Preloader always in the middle - shown when style is selected */}
            {selectedStyle && (
              <View style={styles.preloaderWrapper}>
                <AnimatedPreloader 
                  progress={internalProgress} 
                  status={getCurrentStatusMessage()} 
                />
              </View>
            )}
            
            {/* Prompt message when no style is selected */}
            {!selectedStyle && (
              <View style={styles.promptContainer}>
                <Text style={styles.promptText}>
                  Please select a design style to continue
                </Text>
              </View>
            )}
            
            {/* Style selection cards below */}
            <View style={styles.styleSelectionWrapper}>
              <StyleSelectionComponent 
                onStyleSelected={handleStyleSelected}
                selectedStyle={selectedStyle}
              />
            </View>
            
            {/* Status indicator at the bottom (only show if no style is selected) */}
            {!selectedStyle && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#7C5C3E" />
                <Text style={styles.bottomStatusText}>
                  {getCurrentStatusMessage()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loaderContainer}>
            <AnimatedPreloader 
              progress={internalProgress} 
              status={processingStatus} 
            />
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(255, 249, 245, 0.98)',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  preloaderWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: height * 0.05,
  },
  styleSelectionWrapper: {
    width: '100%',
    flex: 1,
    marginTop: 20,
  },
  statusText: {
    marginTop: 16,
    fontSize: 18,
    color: '#7C5C3E',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  bottomStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7C5C3E',
  },
  promptContainer: {
    padding: 16,
    marginBottom: 16,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 249, 245, 0.8)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: height * 0.05,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
    textAlign: 'center',
    padding: 8,
  },
});

export default PreviewScreenOverlay; 