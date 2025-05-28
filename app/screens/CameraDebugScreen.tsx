import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const CameraDebugScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('CameraDebugScreen mounted');
    addDebugInfo(`Platform: ${Platform.OS}`);
    addDebugInfo(`Permission status: ${permission?.status || 'undefined'}`);
    addDebugInfo(`Permission granted: ${permission?.granted || false}`);
    addDebugInfo(`Can ask again: ${permission?.canAskAgain || false}`);
  }, [permission]);

  const testCameraPermissions = async () => {
    setIsLoading(true);
    addDebugInfo('Testing camera permissions...');
    
    try {
      // Test expo-camera permissions
      addDebugInfo('Requesting expo-camera permissions...');
      const result = await requestPermission();
      addDebugInfo(`Expo-camera permission result: ${JSON.stringify(result)}`);

      // Test ImagePicker camera permissions
      addDebugInfo('Checking ImagePicker camera permissions...');
      const imagePickerCameraStatus = await ImagePicker.getCameraPermissionsAsync();
      addDebugInfo(`ImagePicker camera status: ${JSON.stringify(imagePickerCameraStatus)}`);

      if (!imagePickerCameraStatus.granted) {
        addDebugInfo('Requesting ImagePicker camera permissions...');
        const imagePickerCameraRequest = await ImagePicker.requestCameraPermissionsAsync();
        addDebugInfo(`ImagePicker camera request result: ${JSON.stringify(imagePickerCameraRequest)}`);
      }

      // Test MediaLibrary permissions
      addDebugInfo('Checking MediaLibrary permissions...');
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      addDebugInfo(`MediaLibrary status: ${JSON.stringify(mediaLibraryStatus)}`);

      if (!mediaLibraryStatus.granted) {
        addDebugInfo('Requesting MediaLibrary permissions...');
        const mediaLibraryRequest = await MediaLibrary.requestPermissionsAsync();
        addDebugInfo(`MediaLibrary request result: ${JSON.stringify(mediaLibraryRequest)}`);
      }

    } catch (error) {
      addDebugInfo(`Error testing permissions: ${error.message}`);
      console.error('Permission test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testImagePickerCamera = async () => {
    setIsLoading(true);
    addDebugInfo('Testing ImagePicker camera launch...');
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      addDebugInfo(`ImagePicker camera result: ${JSON.stringify(result)}`);
      
      if (!result.canceled && result.assets[0]) {
        addDebugInfo(`Image captured successfully: ${result.assets[0].uri}`);
        Alert.alert('Success!', 'Camera worked! Image captured successfully.');
      } else {
        addDebugInfo('Camera was canceled or no image captured');
      }
    } catch (error) {
      addDebugInfo(`ImagePicker camera error: ${error.message}`);
      Alert.alert('Camera Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToCameraScreen = () => {
    addDebugInfo('Navigating to CameraScreen...');
    navigation.navigate('Camera' as never);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#7C5C3E" />
        </TouchableOpacity>
        <Text style={styles.title}>Camera Debug</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <Text style={styles.statusText}>
            Permission Status: {permission?.status || 'undefined'}
          </Text>
          <Text style={styles.statusText}>
            Permission Granted: {permission?.granted ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Can Ask Again: {permission?.canAskAgain ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Platform: {Platform.OS}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testCameraPermissions}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test All Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testImagePickerCamera}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test ImagePicker Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#4CAF50' }]} 
            onPress={navigateToCameraScreen}
          >
            <Text style={styles.buttonText}>Go to Camera Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FF6B6B' }]} 
            onPress={clearDebugInfo}
          >
            <Text style={styles.buttonText}>Clear Debug Info</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Log</Text>
          <View style={styles.debugContainer}>
            {debugInfo.length === 0 ? (
              <Text style={styles.debugText}>No debug info yet...</Text>
            ) : (
              debugInfo.map((info, index) => (
                <Text key={index} style={styles.debugText}>{info}</Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C9',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7C5C3E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default CameraDebugScreen; 