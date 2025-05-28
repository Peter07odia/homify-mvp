import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, AppState, LogBox } from 'react-native';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import RoomCreationScreen from '../screens/dashboard/RoomCreationScreen';
import EditCanvasScreen from '../screens/EditCanvasScreen';
import PhotoSelectionScreen from '../screens/PhotoSelectionScreen';
import CameraScreen from '../screens/CameraScreen';
import PreviewScreen from '../screens/PreviewScreen';
import PhotoConfirmationScreen from '../screens/PhotoConfirmationScreen';
import StyleSelectionDemo from '../screens/StyleSelectionDemo';
import { StyleConfirmationScreen } from '../screens/StyleConfirmationScreen';
// import { StyleDemoScreen } from '../screens/StyleDemoScreen';
import StyledRoomScreen from '../screens/StyledRoomScreen';
import ARRoomScanScreen from '../screens/ARRoomScanScreen';
import CameraDebugScreen from '../screens/CameraDebugScreen';

// Define the type for our stack navigator params
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
  RoomCreation: { roomType: string; scanData?: any };
  EditCanvas: { imageUri: string; source: 'camera' | 'gallery' };
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
  PhotoConfirmation: { imageUri: string; isFromCamera: boolean };
  Preview: { 
    imageUri: string; 
    mode?: 'empty' | 'clean'; 
    confirmedStyle?: string;
    jobId?: string;
    cancelCurrentJob?: boolean;
    roomType?: string;
    quality?: string;
    additionalPrompt?: string;
  };
  StyledRoom: {
    originalImageUri: string;
    emptyRoomUrl: string;
    styledRoomUrl: string;
    styleLabel: string;
  };
  StyleConfirmation: { 
    imageUri: string; 
    style: string;
    mode?: 'empty' | 'clean';
  };
  StyleDemo: undefined;
  ARRoomScan: { roomType: string };
  CameraDebug: undefined;
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

export default function Navigation() {
  // Navigation state reference to track screen changes
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  // Monitor navigation performance
  const onNavigationStateChange = (state: any) => {
    if (!state) return;
    
    // Log current route for debugging
    const currentRouteName = state.routes[state.index]?.name;
    console.log(`Current screen: ${currentRouteName}`);
  };

  return (
    <NavigationContainer 
      theme={MyTheme}
      ref={navigationRef}
      onStateChange={onNavigationStateChange}
      onReady={() => {
        console.log('Navigation container is ready');
        console.log('Initial route:', navigationRef.current?.getCurrentRoute()?.name);
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
          animationTypeForReplace: 'push',
          freezeOnBlur: true, // Reduce background processing
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
          name="PhotoConfirmation" 
          component={PhotoConfirmationScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="Preview" 
          component={PreviewScreen}
          options={{
            headerShown: false,
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
          name="StyleDemo" 
          component={StyleSelectionDemo}
          options={{ 
            headerShown: false 
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
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="CameraDebug" 
          component={CameraDebugScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 