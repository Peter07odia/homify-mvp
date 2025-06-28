import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Animated, 
  Dimensions,
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Asset } from 'expo-asset';
import { RootStackParamList } from '../navigation';
import { appImages } from '../assets';
import { useAuth } from '../contexts/AuthContext';

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

const { width, height } = Dimensions.get('window');
const LOGO_WIDTH = 550;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isAuthenticated, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Background zoom animation
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  
  useEffect(() => {
    // Preload all onboarding images in parallel with splash animations
    const preloadImages = async () => {
      try {
        // Preload onboarding images
        const imageAssets = Object.values(appImages).map(image => 
          Asset.fromModule(image).downloadAsync()
        );
        
        await Promise.all(imageAssets);
      } catch (error) {
        console.error('Error preloading onboarding images:', error);
      }
    };
    
    // Start preloading immediately
    preloadImages();
    
    // Start fade animation with shorter duration
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Reduced from 1000ms
      useNativeDriver: true,
    }).start();
    
    // Logo subtle pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.03,
          duration: 1500, // Reduced from 3000ms
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 0.98,
          duration: 1500, // Reduced from 3000ms
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Continuous background zoom animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03, // Reduced zoom effect
          duration: 5000, // Reduced from 10000ms
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 5000, // Reduced from 10000ms
          useNativeDriver: true,
        })
      ])
    ).start();

    // Auto-navigate after 5.5 seconds, but only if auth state is determined
    const autoNavigateTimer = setTimeout(() => {
      if (!loading) {
        // If user is authenticated, skip onboarding and go directly to dashboard
        if (isAuthenticated) {
          navigation.navigate('Dashboard');
        } else {
          navigation.navigate('Onboarding');
        }
      }
    }, 5500);

    // Cleanup timer on component unmount
    return () => {
      clearTimeout(autoNavigateTimer);
    };
  }, [navigation, isAuthenticated, loading]);

  // If auth state changes while on splash screen, navigate immediately
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure splash screen shows for at least a moment
      const delayTimer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.navigate('Dashboard');
        } else {
          navigation.navigate('Onboarding');
        }
      }, 2000); // Minimum 2 seconds on splash

      return () => clearTimeout(delayTimer);
    }
  }, [loading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background image with zoom effect */}
      <Animated.View 
        style={[
          styles.backgroundContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ImageBackground
          source={require('../assets/splashscreen.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>
      
      <SafeAreaView style={styles.contentContainer}>
        {/* Logo and tagline container */}
        <View style={styles.topContentContainer}>
          <Animated.View 
            style={[
              styles.logoContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: logoScaleAnim }]
              }
            ]}
          >
            {/* Logo */}
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            {/* Tagline with text shadow */}
            <Text style={styles.tagline}>Reimagine your living space</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  topContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 0.442, // Respect aspect ratio of 500x221
  },
  tagline: {
    marginTop: -35,
    fontSize: 18,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default SplashScreen; 