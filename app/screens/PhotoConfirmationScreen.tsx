import React from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';

type PhotoConfirmationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PhotoConfirmation'
>;

type PhotoConfirmationScreenRouteProp = RouteProp<
  RootStackParamList,
  'PhotoConfirmation'
>;

const { width, height } = Dimensions.get('window');

const PhotoConfirmationScreen = () => {
  const navigation = useNavigation<PhotoConfirmationScreenNavigationProp>();
  const route = useRoute<PhotoConfirmationScreenRouteProp>();
  const { imageUri, isFromCamera = true } = route.params;

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleUsePhoto = () => {
    console.log('[PhotoConfirmationScreen] FORCE NAVIGATION: Going directly to Preview with empty mode');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // FORCE NAVIGATION RESET - Clear entire navigation stack and go directly to Preview
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Preview',
          params: { 
            imageUri: imageUri,
            mode: 'empty'
          }
        }
      ]
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Photo</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>
      
      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          resizeMode="contain" 
        />
      </View>
      
      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.retakeButton]} 
          onPress={handleRetake}
        >
          <Text style={styles.retakeButtonText}>Retake Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.useButton]} 
          onPress={handleUsePhoto}
        >
          <Text style={styles.useButtonText}>Use Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
    color: '#7C5C3E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0D5C9',
  },
  image: {
    width: width,
    height: height - 200, // Adjust to leave space for buttons and header
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  retakeButton: {
    backgroundColor: '#E0D5C9',
  },
  useButton: {
    backgroundColor: '#7C5C3E',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default PhotoConfirmationScreen; 