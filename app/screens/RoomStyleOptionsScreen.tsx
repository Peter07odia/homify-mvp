import React, { useState } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';

type RoomStyleOptionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoomStyleOptions'
>;

type RoomStyleOptionsScreenRouteProp = RouteProp<
  RootStackParamList,
  'RoomStyleOptions'
>;

const { width } = Dimensions.get('window');

// Sample images - for a real implementation, you would have actual preview images
// For now, we'll just display the original photo in both options
const RoomStyleOptionsScreen = () => {
  const navigation = useNavigation<RoomStyleOptionsScreenNavigationProp>();
  const route = useRoute<RoomStyleOptionsScreenRouteProp>();
  const { photoUri } = route.params;
  const [selectedOption, setSelectedOption] = useState<'empty' | 'upstyle' | null>(null);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };
  
  const handleContinue = () => {
    if (!selectedOption) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (selectedOption === 'empty') {
      // Navigate to the empty room preview with the original photo
      navigation.navigate('Preview', { 
        imageUri: photoUri,
        mode: 'empty'
      });
    } else {
      // Navigate to the upstyle room preview with the original photo
      navigation.navigate('Preview', { 
        imageUri: photoUri,
        mode: 'upstyle'
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Options</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>
      
      <Text style={styles.title}>How would you like to edit your space?</Text>
      
      <ScrollView contentContainerStyle={styles.optionsContainer}>
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedOption === 'empty' && styles.selectedCard
          ]} 
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedOption('empty');
          }}
        >
          {/* Using the original photo as placeholder for now */}
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.emptyRoomOverlay}>
            <Text style={styles.overlayText}>Empty Room Preview</Text>
          </View>
          <Text style={styles.optionTitle}>Empty Room</Text>
          <Text style={styles.optionDescription}>
            Remove all furniture and decorations for a clean slate.
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedOption === 'upstyle' && styles.selectedCard
          ]} 
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedOption('upstyle');
          }}
        >
          {/* Using the original photo as placeholder for now */}
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.upstyleRoomOverlay}>
            <Text style={styles.overlayText}>Upstyle Room Preview</Text>
          </View>
          <Text style={styles.optionTitle}>Upstyle Room</Text>
          <Text style={styles.optionDescription}>
            Keep your space as is and add new furniture or decorations.
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            !selectedOption && styles.disabledButton
          ]} 
          onPress={handleContinue}
          disabled={!selectedOption}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: 34,
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#7C5C3E',
  },
  optionsContainer: {
    paddingBottom: 20,
  },
  optionCard: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F0EAE3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#7C5C3E',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyRoomOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upstyleRoomOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#7C5C3E',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8B7E74',
  },
  actionContainer: {
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCBBAA',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default RoomStyleOptionsScreen; 