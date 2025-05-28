import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import * as Haptics from 'expo-haptics';

type StyleConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StyleConfirmation'>;
type StyleConfirmationRouteProp = RouteProp<RootStackParamList, 'StyleConfirmation'>;

interface StyleConfirmationScreenProps {
  navigation: StyleConfirmationNavigationProp;
  route: StyleConfirmationRouteProp;
}

export const StyleConfirmationScreen: React.FC<StyleConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { imageUri, emptyRoomUri, selectedStyle } = route.params;

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleConfirmStyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to Preview with the confirmed style for processing
    navigation.navigate('Preview', {
      imageUri: imageUri,
      mode: 'clean',
      confirmedStyle: selectedStyle
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Your Style</Text>
        </View>

        {/* Style Preview */}
        <View style={styles.stylePreview}>
          <Text style={styles.selectedStyleTitle}>Selected Style: {selectedStyle}</Text>
          
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: emptyRoomUri || imageUri }} 
              style={styles.previewImage}
              resizeMode="contain"
            />
            <View style={styles.styleOverlay}>
              <Text style={styles.styleLabel}>{selectedStyle} Style</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.backToPreviewButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backToPreviewButtonText}>Back to Preview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmStyle}
          >
            <Text style={styles.confirmButtonText}>Confirm & Transform</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7C5C3E',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginRight: 50, // Offset for back button
  },
  stylePreview: {
    flex: 1,
    alignItems: 'center',
  },
  selectedStyleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: '70%',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  styleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  styleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backToPreviewButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#7C5C3E',
    borderRadius: 25,
    marginRight: 10,
    alignItems: 'center',
  },
  backToPreviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#7C5C3E',
    borderRadius: 25,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 