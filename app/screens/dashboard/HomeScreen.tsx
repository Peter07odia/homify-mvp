import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';
import * as ImagePicker from 'expo-image-picker';
import PhotoSourceActionSheet from '../../components/PhotoSourceActionSheet';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2; // 2 cards per row with margins (20+20+8+8)

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  image: any;
  gradient: string[];
  action: () => void;
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);

  const handleFeaturePress = (feature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (feature) {
      case 'find-ideas':
        // TODO: Navigate to inspiration gallery
        console.log('Navigate to Find Ideas');
        break;
      case 'chat-ai':
        // TODO: Navigate to AI chat
        console.log('Navigate to AI Chat');
        break;
      case 'search-photo':
        // TODO: Navigate to photo search
        console.log('Navigate to Photo Search');
        break;
      case 'restyle-ai':
        // Show photo source action sheet
        setShowPhotoSourceSheet(true);
        break;
    }
  };

  const handleTakePhoto = async () => {
    try {
      console.log('📸 Taking photo...');
      
      // Check if we're in Expo Go
      const isExpoGo = __DEV__ && !Constants.isDevice;
      if (isExpoGo) {
        Alert.alert(
          'Camera Not Available', 
          'Camera access requires a development build. Please use "Choose from Gallery" instead or build a development version of the app.'
        );
        return;
      }
      
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission:', cameraPermission);
      
      if (!cameraPermission.granted) {
        Alert.alert(
          'Permission needed', 
          'Camera permission is required to take photos. Please enable it in your device settings.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('📸 Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Navigating to EditCanvas with:', { imageUri, source: 'camera' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'camera'
        });
      } else {
        console.log('📸 Camera was canceled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', `Failed to open camera: ${error.message}`);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      console.log('🖼️ Choosing from gallery...');
      
      // Request media library permissions
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🖼️ Gallery permission:', libraryPermission);
      
      if (!libraryPermission.granted) {
        Alert.alert(
          'Permission needed', 
          'Photo library permission is required to select images. Please enable it in your device settings.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('🖼️ Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ Navigating to EditCanvas with:', { imageUri, source: 'gallery' });
        navigation.navigate('EditCanvas', { 
          imageUri,
          source: 'gallery'
        });
      } else {
        console.log('🖼️ Gallery was canceled or no image selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', `Failed to open photo library: ${error.message}`);
    }
  };

  const featureCards: FeatureCard[] = [
    {
      id: 'find-ideas',
      title: 'Find Ideas',
      description: 'Discover trending designs and inspiration',
      image: require('../../assets/images/find ideas.png'),
      gradient: ['#FFF9F5', '#F5E6D3'],
      action: () => handleFeaturePress('find-ideas'),
    },
    {
      id: 'chat-ai',
      title: 'Chat with Designer (AI)',
      description: 'Get personalized design advice instantly',
      image: require('../../assets/images/Ai designer.png'),
      gradient: ['#F5E6D3', '#E3C4A0'],
      action: () => handleFeaturePress('chat-ai'),
    },
    {
      id: 'search-photo',
      title: 'Photo search in stores',
      description: 'Find similar designs from any photo',
      image: require('../../assets/images/search with product.png'),
      gradient: ['#E3C4A0', '#D4A574'],
      action: () => handleFeaturePress('search-photo'),
    },
    {
      id: 'restyle-ai',
      title: 'Restyle Photo with AI',
      description: 'Transform your space with AI magic',
      image: require('../../assets/images/upstyle with AI.png'),
      gradient: ['#D4A574', '#C4956B'],
      action: () => handleFeaturePress('restyle-ai'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>Ready to design?</Text>
          </View>
          <TouchableOpacity style={styles.chatButton}>
            <MaterialIcons name="chat" size={24} color="#7C5C3E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Rooms Styled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Projects Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Items Ordered</Text>
          </View>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What would you like to do?</Text>
        </View>

        <View style={styles.cardsGrid}>
          {featureCards.map((card, index) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.featureCard,
                index % 2 === 0 ? styles.cardLeft : styles.cardRight,
              ]}
              onPress={card.action}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={card.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={card.image}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  </View>
                  {card.id !== 'find-ideas' && card.id !== 'chat-ai' && (
                    <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                      {card.title}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="meeting-room" size={20} color="#7C5C3E" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Living Room Styled</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#CCBBAA" />
          </View>
          
          <View style={styles.activityDivider} />
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="shopping-bag" size={20} color="#7C5C3E" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>3 items added to cart</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#CCBBAA" />
          </View>
        </View>
      </ScrollView>

      {/* Photo Source Action Sheet */}
      <PhotoSourceActionSheet
        visible={showPhotoSourceSheet}
        onClose={() => setShowPhotoSourceSheet(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 2,
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  featureCard: {
    width: cardWidth,
    height: cardWidth * 1.1, // Slightly taller to accommodate image
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLeft: {
    marginRight: 8,
  },
  cardRight: {
    marginLeft: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 15,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
});

export default HomeScreen; 