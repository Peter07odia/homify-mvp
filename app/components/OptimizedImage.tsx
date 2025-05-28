import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Image, ImageSource } from 'expo-image';

interface OptimizedImageProps {
  source: ImageSource;
  style?: ImageStyle | ViewStyle;
  placeholder?: ImageSource;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  onLoad?: () => void;
  onError?: (error: any) => void;
  lazy?: boolean;
  blurhash?: string;
  testID?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  contentFit = 'cover',
  transition = 200,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  onLoad,
  onError,
  lazy = false,
  blurhash,
  testID,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  const imageStyle = [
    styles.image,
    style,
    hasError && styles.errorImage,
  ];

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Image
        source={source}
        style={imageStyle}
        placeholder={placeholder || blurhash}
        contentFit={contentFit}
        transition={transition}
        priority={priority}
        cachePolicy={cachePolicy}
        onLoad={handleLoad}
        onError={handleError}
        recyclingKey={typeof source === 'object' && 'uri' in source ? source.uri : undefined}
      />
      
      {isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C5C3E" />
        </View>
      )}
      
      {hasError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorImage: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
});

export default OptimizedImage; 