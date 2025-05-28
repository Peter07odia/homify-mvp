import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface ProcessingProgressProps {
  status: string;
  progress: number;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  status,
  progress,
}) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progress * 100}%` }
          ]} 
        />
      </View>
      <ActivityIndicator size="large" color="#7C5C3E" style={styles.loadingIndicator} />
      <Text style={styles.loadingText}>{status}</Text>
      <Text style={styles.loadingSubtext}>
        This may take up to a minute depending on your connection.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0D5C9',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C5C3E',
    borderRadius: 4,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C5C3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#8B7E74',
    textAlign: 'center',
  },
}); 