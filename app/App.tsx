import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Navigation from './navigation';
import { AuthProvider } from './contexts/AuthContext';
import WorkflowIntegration from './utils/workflowIntegration';

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  // REMOVED: Auto-initialization of polling to prevent auto-triggering workflows
  // This was causing repeated calls to the Edge Function and consuming credits
  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       console.log('🚀 [App] Initializing polling service...');
  //       await WorkflowIntegration.initializePolling();
  //       console.log('✅ [App] Polling service initialized');
  //     } catch (error) {
  //       console.error('❌ [App] Error initializing polling:', error);
  //     }
  //   };

  //   initializeApp();
  // }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
} 