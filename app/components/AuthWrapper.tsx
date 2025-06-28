import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthPromptModal from './AuthPromptModal';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, shouldShowAuthPrompt, dismissAuthPrompt } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigation = useNavigation();
  
  // Safely get the current route
  let currentRouteName = '';
  try {
    const route = useRoute();
    currentRouteName = route.name;
  } catch (error) {
    // If we can't get the route, we're probably not in a navigation context yet
    console.log('AuthWrapper: Unable to get current route');
  }

  // List of screens where we should NOT show auth prompts
  const excludedScreens = [
    'Splash',
    'Onboarding', 
    'Auth'
  ];

  useEffect(() => {
    // Only show auth prompt if:
    // 1. User is not authenticated
    // 2. Auth context says we should show prompt
    // 3. We're not on an excluded screen
    // 4. Modal is not already showing
    if (
      !isAuthenticated && 
      shouldShowAuthPrompt && 
      currentRouteName && // Only check if we have a route name
      !excludedScreens.includes(currentRouteName) &&
      !showAuthModal
    ) {
      setShowAuthModal(true);
    }
  }, [shouldShowAuthPrompt, isAuthenticated, currentRouteName, showAuthModal]);

  const handleAuthPromptDismiss = () => {
    setShowAuthModal(false);
    dismissAuthPrompt();
  };

  const handleSignUp = () => {
    setShowAuthModal(false);
    try {
      // @ts-ignore - navigation.navigate is properly typed in the actual usage
      navigation.navigate('Auth');
    } catch (error) {
      console.log('AuthWrapper: Unable to navigate to Auth screen');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* Global Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthModal}
        onDismiss={handleAuthPromptDismiss}
        onSignUp={handleSignUp}
      />
    </View>
  );
};

export default AuthWrapper; 