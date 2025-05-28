import React, { useState, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  ScrollView,
  Dimensions,
  Animated,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

const { width, height } = Dimensions.get('window');

const CAROUSEL_OPTIONS = [
  {
    id: 'empty',
    title: 'Empty Room',
    description: 'Best for new spaces',
    image: require('../assets/emptyroom.png')
  },
  {
    id: 'clean',
    title: 'Upstyle Room',
    description: 'Best for changing furniture',
    image: require('../assets/cleanroom.png')
  }
];

const RoomStyleOptionsScreen = () => {
  const navigation = useNavigation<RoomStyleOptionsScreenNavigationProp>();
  const route = useRoute<RoomStyleOptionsScreenRouteProp>();
  const { photoUri } = route.params;
  const [selectedOption, setSelectedOption] = useState<'empty' | 'clean' | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
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
        mode: 'clean'
      });
    }
  };

  const handleSelect = (option: 'empty' | 'clean') => {
    Haptics.selectionAsync();
    setSelectedOption(option);
    
    // Scroll to the selected option
    const index = CAROUSEL_OPTIONS.findIndex(item => item.id === option);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };
  
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setActiveIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <TouchableOpacity 
        style={styles.carouselItemTouch}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.95}
      >
        <Image source={item.image} style={styles.carouselImage} />
        
        {/* Top-right selection button */}
        <TouchableOpacity
          style={[
            styles.checkmarkButton,
            selectedOption === item.id && styles.checkmarkButtonSelected
          ]}
          onPress={() => handleSelect(item.id)}
          activeOpacity={0.9}
        >
          {selectedOption === item.id && (
            <View style={styles.checkmark} />
          )}
        </TouchableOpacity>
        
        <View style={styles.textOverlay}>
          <Text style={styles.optionTitle}>{item.title}</Text>
          <Text style={styles.overlayText}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Style</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>
      
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={CAROUSEL_OPTIONS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        
        <View style={styles.paginationContainer}>
          {CAROUSEL_OPTIONS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive
              ]} 
            />
          ))}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        {!selectedOption && (
          <Text style={styles.selectionPrompt}>
            Select a style to continue
          </Text>
        )}
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
      
      {/* Debug button for development only */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => navigation.navigate('StyleDemo')}
        >
          <Text style={styles.debugButtonText}>Style Selection Demo</Text>
        </TouchableOpacity>
      )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C5C3E',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  carouselContainer: {
    flex: 1,
  },
  carouselItem: {
    width: width,
    height: '100%',
  },
  carouselItemTouch: {
    flex: 1,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
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
  instructionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7C5C3E',
    fontWeight: '500',
  },
  selectionPrompt: {
    textAlign: 'center',
    color: '#7C5C3E',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'white',
    marginTop: 10,
  },
  selectedButton: {
    backgroundColor: 'rgba(124, 92, 62, 0.8)',
    borderColor: '#7C5C3E',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  checkmarkButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkmarkButtonSelected: {
    backgroundColor: '#7C5C3E',
    borderColor: '#FFFFFF',
  },
  checkmark: {
    width: 18,
    height: 10,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
  },
  // Debug button style
  debugButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default RoomStyleOptionsScreen; 