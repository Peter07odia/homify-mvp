import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SplashScreen = () => (
  <View style={styles.container}>
    <Text style={styles.label}>Splash Screen (Rename as needed)</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 20,
    color: '#888',
  },
});

export default SplashScreen; 