import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PreviewScreenOverlay from '../screens/PreviewScreenOverlay';
import { 
  DesignStyle, 
  isStyleSelectionEnabled, 
  setUserPreferredStyle 
} from '../services/styleService';
import { ProcessingMode } from '../services/roomService';

interface StyleSelectionWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  processingStatus: string;
  processingProgress: number;
  mode: ProcessingMode;
  onStyleSelected?: (styleId: DesignStyle) => void;
}

/**
 * A wrapper component that can be used to add style selection to any screen
 * without modifying the existing component.
 */
const StyleSelectionWrapper: React.FC<StyleSelectionWrapperProps> = ({
  children,
  isLoading,
  processingStatus,
  processingProgress,
  mode,
  onStyleSelected,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(null);

  // Handle style selection
  const handleStyleSelected = (styleId: DesignStyle) => {
    setSelectedStyle(styleId);
    setUserPreferredStyle(styleId);
    
    // Call parent handler if provided
    if (onStyleSelected) {
      onStyleSelected(styleId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Render the wrapped component */}
      {children}
      
      {/* Only show the overlay if feature is enabled and we're loading */}
      {isStyleSelectionEnabled() && isLoading && (
        <PreviewScreenOverlay
          isVisible={isLoading}
          processingStatus={processingStatus}
          processingProgress={processingProgress}
          mode={mode}
          onStyleSelected={handleStyleSelected}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default StyleSelectionWrapper; 