import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  FlatList,
  Animated,
  Image,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation';
import { appImages } from '../assets';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const { width, height } = Dimensions.get('window');

// Onboarding slides content
const slides = [
  {
    id: '1',
    title: 'AI Analyzes Your Room Instantly',
    description: 'Snap a photo and watch our smart technology identify every detail in your space.',
    image: appImages.onboarding1,
  },
  {
    id: '2',
    title: 'See Your Room Transformed',
    description: 'Before and after magic that shows your space\'s incredible potential.',
    image: appImages.onboarding2,
  },
  {
    id: '3',
    title: 'Shop Direct From Popular Stores',
    description: 'Buy furniture instantly from your favorite brands and retailers.',
    image: appImages.onboarding3,
  },
  {
    id: '4',
    title: 'AR Furniture Placement Made Easy',
    description: 'Place virtual furniture in your real space before buying.',
    image: appImages.onboarding4,
  },
  {
    id: '5',
    title: 'Precise Measurements, Perfect Fit Guaranteed',
    description: 'Every piece fits perfectly with our accurate room measurements.',
    image: appImages.onboarding5,
  },
  {
    id: '6',
    title: 'Endless Designs, Limitless Possibilities',
    description: 'Bring your wildest interior design ideas to life instantly.',
    image: appImages.onboarding6,
  },
  {
    id: '7',
    title: 'Design Any Room, Any Style',
    description: 'Transform bedrooms, kitchens, living rooms—every space becomes extraordinary.',
    image: appImages.onboarding7,
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isAuthenticated, shouldShowAuthPrompt, dismissAuthPrompt } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const [imageStatuses, setImageStatuses] = useState<Record<string, boolean>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Track when each image loads
  const handleImageLoad = (id: string) => {
    setImageStatuses(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  useEffect(() => {
    // Pre-cache the current and next image
    const cacheImages = async () => {
      if (currentIndex < slides.length) {
        try {
          // Pre-warm the image that's currently visible
          const currentImage = Asset.fromModule(slides[currentIndex].image);
          await currentImage.downloadAsync();
          
          // And prepare the next one if it exists
          if (currentIndex + 1 < slides.length) {
            const nextImage = Asset.fromModule(slides[currentIndex + 1].image);
            await nextImage.downloadAsync();
          }
        } catch (error) {
          console.error('Error caching image:', error);
        }
      }
    };
    
    cacheImages();
  }, [currentIndex]);

  // Show auth prompt when appropriate
  useEffect(() => {
    if (shouldShowAuthPrompt && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [shouldShowAuthPrompt, isAuthenticated]);
  
  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);
    
    // Small delay for visual feedback
    setTimeout(() => {
      // If user is authenticated, go directly to dashboard
      // If not authenticated, go to dashboard but auth prompts will appear
      navigation.navigate('Dashboard');
    }, 150);
  }, [navigation]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      Haptics.selectionAsync();
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };
  
  const handleBack = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      slidesRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const handleAuthPromptDismiss = () => {
    setShowAuthModal(false);
    dismissAuthPrompt();
  };

  const handleSignUp = () => {
    setShowAuthModal(false);
    navigation.navigate('Auth');
  };

  const renderOnboardingItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width: windowWidth }]}>
        <View style={styles.imageContainer}>
          <Image 
            source={item.image} 
            style={styles.image}
            resizeMode="cover"
            onLoad={() => handleImageLoad(item.id)}
            // Critical: disable fade-in animation for better performance
            fadeDuration={0}
          />
          {!imageStatuses[item.id] && (
            <ActivityIndicator 
              size="large" 
              color="#7C5C3E" 
              style={styles.loader} 
            />
          )}
          
          {/* Gradient overlay effect */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />
          
          {/* Text overlay at the bottom of the image */}
          <View style={styles.textOverlay}>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={{ flex: 1 }}>
        <FlatList
          data={slides}
          renderItem={renderOnboardingItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          scrollEventThrottle={32}
          style={{ flex: 1 }}
        />
        
        <View style={styles.buttonContainer}>
          {/* Back Button */}
          {currentIndex > 0 ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          
          {/* Page Indicators in the center */}
          <View style={styles.indicatorContainer}>
            {slides.map((_, index) => {
              const inputRange = [
                (index - 1) * windowWidth,
                index * windowWidth,
                (index + 1) * windowWidth,
              ];
              
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: 'clamp',
              });
              
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              
              return (
                <Animated.View
                  key={index.toString()}
                  style={[
                    styles.indicator,
                    { width: dotWidth, opacity },
                  ]}
                />
              );
            })}
          </View>
          
          {/* Next/Get Started Button */}
          {currentIndex === slides.length - 1 ? (
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleGetStarted}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.nextButtonText}>GET STARTED</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>NEXT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthModal}
        onDismiss={handleAuthPromptDismiss}
        onSignUp={handleSignUp}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  slide: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 90,
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 90,
    alignItems: 'flex-end',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -20,
  },
});

export default OnboardingScreen; 