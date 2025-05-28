import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { quickConnectivityCheck } from '../debug/webhookTest';

interface ProcessingErrorProps {
  error: string;
  onTryAgain: () => void;
  onRunDiagnostics?: () => void;
  showDiagnostics?: boolean;
}

export const ProcessingError: React.FC<ProcessingErrorProps> = ({
  error,
  onTryAgain,
  onRunDiagnostics,
  showDiagnostics = false,
}) => {
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if this is a connection error
  const isConnectionError = error.toLowerCase().includes('unable to connect') || 
                           error.toLowerCase().includes('network') ||
                           error.toLowerCase().includes('internet connection');

  const runQuickDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticResults(['Running diagnostics...']);
    
    try {
      const result = await quickConnectivityCheck();
      setDiagnosticResults(result.details);
      
      if (!result.isConnected && result.error) {
        setDiagnosticResults(prev => [...prev, `❌ Final result: ${result.error}`]);
      }
    } catch (error) {
      setDiagnosticResults(['❌ Diagnostic test failed', error.message || 'Unknown error']);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const getTroubleshootingTips = () => {
    if (isConnectionError) {
      return [
        'Check your internet connection',
        'Try switching between WiFi and mobile data',
        'Disable VPN if you\'re using one',
        'Check if other apps can access the internet',
        'The N8N processing service might be temporarily down'
      ];
    }
    
    return [
      'Try taking a new photo with better lighting',
      'Ensure the image shows a clear room view',
      'Check your internet connection',
      'Try again in a few moments'
    ];
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.errorContainer}>
      <Text style={styles.errorTitle}>Processing Failed</Text>
      <Text style={styles.errorText}>{error}</Text>
      
      {/* Troubleshooting section for connection errors */}
      {isConnectionError && (
        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting Tips:</Text>
          {getTroubleshootingTips().map((tip, index) => (
            <Text key={index} style={styles.troubleshootingItem}>
              • {tip}
            </Text>
          ))}
          
          {/* Quick diagnostics button */}
          <TouchableOpacity 
            style={[styles.diagnosticsButton, runningDiagnostics && styles.disabledButton]} 
            onPress={runQuickDiagnostics}
            disabled={runningDiagnostics}
          >
            <Text style={styles.diagnosticsButtonText}>
              {runningDiagnostics ? 'Running Tests...' : 'Run Connection Test'}
            </Text>
          </TouchableOpacity>
          
          {/* Show diagnostic results */}
          {diagnosticResults.length > 0 && (
            <View style={styles.diagnosticResultsContainer}>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setShowDetails(!showDetails)}
              >
                <Text style={styles.toggleButtonText}>
                  {showDetails ? 'Hide' : 'Show'} Test Results
                </Text>
              </TouchableOpacity>
              
              {showDetails && (
                <View style={styles.diagnosticResults}>
                  {diagnosticResults.map((result, index) => (
                    <Text key={index} style={styles.diagnosticResult}>
                      {result}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
      
      <View style={styles.errorButtonsContainer}>
        <TouchableOpacity style={styles.errorButton} onPress={onTryAgain}>
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        {showDiagnostics && onRunDiagnostics && (
          <TouchableOpacity 
            style={[styles.errorButton, styles.debugButton]} 
            onPress={onRunDiagnostics}
          >
            <Text style={styles.errorButtonText}>Full Diagnostics</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF9F5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7C5C3E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  troubleshootingContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 249, 245, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 62, 0.2)',
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C5C3E',
    marginBottom: 12,
  },
  troubleshootingItem: {
    fontSize: 14,
    color: '#7C5C3E',
    marginBottom: 8,
    lineHeight: 20,
  },
  diagnosticsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A5A5A5',
  },
  diagnosticsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosticResultsContainer: {
    marginTop: 16,
  },
  toggleButton: {
    backgroundColor: 'rgba(124, 92, 62, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#7C5C3E',
    fontSize: 14,
    fontWeight: '500',
  },
  diagnosticResults: {
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  diagnosticResult: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  errorButton: {
    backgroundColor: '#7C5C3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    flex: 1,
    maxWidth: 150,
  },
  debugButton: {
    backgroundColor: '#FF9800',
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 