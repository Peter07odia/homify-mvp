import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation';

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
    emptyRoomUrl, 
    styledRoomUrl, 
    styleLabel 
  } = route.params;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<'original' | 'empty' | 'styled'>('styled');

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleStartOver = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PhotoSelection');
  }, [navigation]);

  const handleTryDifferentStyle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  }, [navigation]);

  const getCurrentImageUri = () => {
    switch (currentView) {
      case 'original':
        return originalImageUri;
      case 'empty':
        return emptyRoomUrl;
      case 'styled':
        return styledRoomUrl;
      default:
        return styledRoomUrl;
    }
  };

  const getCurrentLabel = () => {
    switch (currentView) {
      case 'original':
        return 'Original Room';
      case 'empty':
        return 'Empty Room';
      case 'styled':
        return `${styleLabel} Style`;
      default:
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
          <Text style={styles.headerTitle}>Styled Room</Text>
          <View style={styles.placeholder} />
        </View>

        {/* View Toggle Buttons */}
        <View style={styles.toggleSection}>
          <Text style={styles.toggleTitle}>Compare Views</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                currentView === 'original' && styles.activeToggleButton
              ]}
              onPress={() => setCurrentView('original')}
            >
              <Text style={[
                styles.toggleButtonText,
                currentView === 'original' && styles.activeToggleButtonText
              ]}>
                Original
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                currentView === 'empty' && styles.activeToggleButton
              ]}
              onPress={() => setCurrentView('empty')}
            >
              <Text style={[
                styles.toggleButtonText,
                currentView === 'empty' && styles.activeToggleButtonText
              ]}>
                Empty
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                currentView === 'styled' && styles.activeToggleButton
              ]}
              onPress={() => setCurrentView('styled')}
            >
              <Text style={[
                styles.toggleButtonText,
                currentView === 'styled' && styles.activeToggleButtonText
              ]}>
                Styled
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Display */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Text style={styles.currentViewLabel}>{getCurrentLabel()}</Text>
            
            {!imageLoaded && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C5C3E" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
            
            <Image 
              source={{ uri: getCurrentImageUri() }} 
              style={[styles.image, !imageLoaded && styles.hiddenImage]}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={() => {
                console.error('Failed to load image:', getCurrentImageUri());
                setImageLoaded(true);
              }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleTryDifferentStyle}
          >
            <MaterialIcons name="palette" size={20} color="#7C5C3E" />
            <Text style={styles.secondaryButtonText}>Try Different Style</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartOver}
          >
            <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Style Another Room</Text>
          </TouchableOpacity>
        </View>
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
  toggleSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 15,
    textAlign: 'center',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeToggleButton: {
    backgroundColor: '#7C5C3E',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeToggleButtonText: {
    color: '#FFFFFF',
  },
  imageSection: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  imageContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentViewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  hiddenImage: {
    opacity: 0,
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
});

export default StyledRoomScreen; 