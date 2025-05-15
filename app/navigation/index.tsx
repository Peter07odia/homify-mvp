import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import CameraScreen from '../screens/CameraScreen';
import PreviewScreen from '../screens/PreviewScreen';
import PhotoConfirmationScreen from '../screens/PhotoConfirmationScreen';
import RoomStyleOptionsScreen from '../screens/RoomStyleOptionsScreen';

// Define the type for our stack navigator params
export type RootStackParamList = {
  Onboarding: undefined;
  Camera: undefined;
  PhotoConfirmation: { imageUri: string };
  RoomStyleOptions: { photoUri: string };
  Preview: { imageUri: string; mode?: 'empty' | 'upstyle' };
};

// Create the stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="PhotoConfirmation" component={PhotoConfirmationScreen} />
        <Stack.Screen name="RoomStyleOptions" component={RoomStyleOptionsScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation; 