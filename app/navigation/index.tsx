import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, AppState, LogBox } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthWrapper from '../components/AuthWrapper';
import { DashboardTabParamList } from '../screens/dashboard/DashboardScreen';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import RoomCreationScreen from '../screens/dashboard/RoomCreationScreen';
import EditCanvasScreen from '../screens/EditCanvasScreen';
import PhotoSelectionScreen from '../screens/PhotoSelectionScreen';
import CameraScreen from '../screens/CameraScreen';
import { StyleConfirmationScreen } from '../screens/StyleConfirmationScreen';
import StyledRoomScreen from '../screens/StyledRoomScreen';
import ARRoomScanScreen from '../screens/ARRoomScanScreen';
import ProcessingStatusScreen from '../screens/ProcessingStatusScreen';

// Define the type for our stack navigator params
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Dashboard: {
    screen?: keyof DashboardTabParamList;
    params?: {
      initialTab?: string;
    };
  } | undefined;
  RoomCreation: { roomType: string; scanData?: any };
  EditCanvas: { 
    imageUri: string; 
    source: 'camera' | 'gallery';
    existingEmptyUrl?: string;
    mode?: 'empty' | 'clean';
    roomType?: string;
  };
  Camera: { 
    returnToPreview?: boolean;
    activeJobId?: string;
  } | undefined;
  PhotoSelection: { 
    returnToPreview?: boolean;
    activeJobId?: string;
    roomType?: string;
    roomData?: any;
    mode?: 'style';
  } | undefined;
  ProcessingStatus: {
    photoId: string;
    originalUrl: string;
    emptyUrl?: string;
    styledUrl?: string;
    status: string;
    style?: string;
    roomType?: string;
  };
  StyledRoom: {
    originalImageUri: string;
    emptyRoomUrl: string;
    styledRoomUrl: string;
    styleLabel: string;
    autoRoute?: boolean; // Only auto-route when true (for new processing results)
  };
  StyleConfirmation: { 
    imageUri: string; 
    style: string;
    mode?: 'empty' | 'clean';
  };
  ARRoomScan: { roomType: string };
};

// Create custom theme to avoid any flashy transitions
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFF9F5'
  },
};

// Create the stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation component that uses auth context
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  
  // Navigation state reference to track screen changes
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  // Monitor navigation performance
  const onNavigationStateChange = (state: any) => {
    if (!state) return;
    
    // Log current route for debugging
    const currentRouteName = state.routes[state.index]?.name;
    console.log(`Current screen: ${currentRouteName}`);
  };

  // Don't render navigation until auth state is determined
  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer 
      theme={MyTheme}
      ref={navigationRef}
      onStateChange={onNavigationStateChange}
      onReady={() => {
        console.log('Navigation container is ready');
        console.log('Initial route:', navigationRef.current?.getCurrentRoute()?.name);
        console.log('User authenticated:', isAuthenticated);
      }}
    >
      <AuthWrapper>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
            animationTypeForReplace: 'push',
            freezeOnBlur: false, // Allow proper modal handling for image picker
            orientation: 'portrait', // Force portrait to avoid rotation issues
            presentation: 'card',
          }}
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={{
              animation: 'none',
            }} 
          />
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{
              animation: 'none',
              animationDuration: 0,
            }} 
          />
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="RoomCreation" 
            component={RoomCreationScreen}
            options={{
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="EditCanvas" 
            component={EditCanvasScreen}
            options={{
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="PhotoSelection" 
            component={PhotoSelectionScreen}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="StyleConfirmation" 
            component={StyleConfirmationScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="StyledRoom" 
            component={StyledRoomScreen}
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="ARRoomScan" 
            component={ARRoomScanScreen}
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="ProcessingStatus" 
            component={ProcessingStatusScreen}
            options={{ 
              headerShown: false 
            }} 
          />
        </Stack.Navigator>
      </AuthWrapper>
    </NavigationContainer>
  );
}

export default function Navigation() {
  return <AppNavigator />;
} 