import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { pollJobStatus, uploadRoomImage } from '../services/roomService';
import { clearImageCache, performIOSMemoryCleanup } from '../lib/memoryHelper';
import { DesignStyle, applyStyleToRoom } from '../services/styleService';
import { RootStackParamList } from '../navigation';

export interface ProcessingState {
  loading: boolean;
  processingStatus: string;
  processingProgress: number;
  originalUrl: string | null;
  processedUrl: string | null;
  error: string | null;
  jobId: string | null;
  selectedDesignStyle: DesignStyle;
  stage: 'empty' | 'styling' | 'complete';
  emptyRoomUrl: string | null;
}

export interface ProcessingActions {
  startProcessing: () => Promise<void>;
  handleTryAgain: () => void;
  handleStyleSelected: (styleId: DesignStyle) => void;
  retryStyleOnly: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useImageProcessing = (imageUri: string, mode: 'empty' | 'clean') => {
  const navigation = useNavigation<NavigationProp>();
  const isMounted = useRef(true);
  const processingStarted = useRef(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<DesignStyle>(null);
  const [stage, setStage] = useState<'empty' | 'styling' | 'complete'>('empty');
  const [emptyRoomUrl, setEmptyRoomUrl] = useState<string | null>(null);

  // Clear timeouts
  const clearTimeouts = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Handle processing success
  const handleProcessingSuccess = useCallback((result: any) => {
    if (!isMounted.current) return;
    
    console.log('[useImageProcessing] Processing success:', {
      stage,
      status: result.status,
      emptyUrl: result.emptyUrl ? 'present' : 'null',
      styledUrl: result.styledUrl ? 'present' : 'null',
      fullResult: result
    });
    
    if (stage === 'empty' && (result.status === 'empty_complete' || result.status === 'done')) {
      // Empty room stage complete
      setProcessingProgress(1.0);
      setProcessingStatus('Empty room ready!');
      setEmptyRoomUrl(result.emptyUrl);
      setOriginalUrl(result.cleanUrl);
      setStage('styling');
      setLoading(false);
      console.log('[useImageProcessing] Empty room ready - showing style selection');
      
    } else if (stage === 'styling' && result.status === 'done') {
      // Styling stage complete - navigate to StyledRoom screen
      setProcessingProgress(1.0);
      setProcessingStatus('Styled room complete!');
      
      if (result.styledUrl) {
        console.log('[useImageProcessing] Styling complete, navigating to StyledRoom screen');
        
        // Get style label for display
        const styleOptions = {
          'minimal': 'Classic',
          'modern': 'Minimalist', 
          'botanical': 'Modern',
          'scandinavian': 'Botanical',
          'industrial': 'Industrial',
          'bohemian': 'Bohemian'
        };
        const styleLabel = styleOptions[selectedDesignStyle] || selectedDesignStyle;
        
        // Navigate to styled room screen
        navigation.navigate('StyledRoom', {
          originalImageUri: imageUri,
          emptyRoomUrl: emptyRoomUrl || result.emptyUrl,
          styledRoomUrl: result.styledUrl,
          styleLabel: styleLabel
        });
        
        setStage('complete');
        setLoading(false);
      } else {
        console.warn('[useImageProcessing] No styled URL found in result:', result);
        handleProcessingError('No styled image was generated. Please try again.');
      }
    }
    
    setError(null);
    clearTimeouts();
  }, [stage, clearTimeouts, selectedDesignStyle, navigation, imageUri, emptyRoomUrl]);

  // Handle processing error
  const handleProcessingError = useCallback((error: any) => {
    if (!isMounted.current) return;
    
    console.error('[useImageProcessing] Processing error:', error);
    
    let errorMessage = 'Processing failed. Please try again.';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    // For styling errors, don't reset the entire stage - keep the empty room ready
    if (stage === 'styling' && (error?.status === 'style_error' || errorMessage.includes('style'))) {
      console.log('[useImageProcessing] Style error occurred, keeping styling stage active for retry');
      setError(`Style application failed: ${errorMessage}`);
      setLoading(false);
      // Don't reset stage or emptyRoomUrl - allow retry
    } else {
      setError(errorMessage);
      setLoading(false);
      setProcessingProgress(0);
    }
    
    clearTimeouts();
  }, [clearTimeouts, stage]);

  // Start polling for results
  const startPolling = useCallback(async (jobId: string) => {
    if (!isMounted.current) return;
    
    console.log('[useImageProcessing] Starting polling for job:', jobId);
    setProcessingStatus('Processing your image...');
    
    try {
      const result = await pollJobStatus(jobId, 3000, 40, (status) => {
        if (!isMounted.current) return;
        
        if (status === 'processing') {
          setProcessingProgress(prev => {
            const newProgress = prev + 0.02;
            
            if (newProgress < 0.4) {
              setProcessingStatus('Analyzing room structure...');
            } else if (newProgress < 0.6) {
              setProcessingStatus(`${mode === 'empty' ? 'Removing furniture' : 'Decluttering room'}...`);
            } else if (newProgress < 0.8) {
              setProcessingStatus('Processing walls and lighting...');
            } else {
              setProcessingStatus('Almost ready...');
            }
            
            return Math.min(newProgress, 0.9);
          });
        } else {
          setProcessingStatus(status);
        }
      });
      
      if (result.status === 'done') {
        handleProcessingSuccess(result);
      } else if (result.status === 'empty_complete') {
        handleProcessingSuccess(result);
      } else if (result.status === 'error' || result.status === 'style_error') {
        handleProcessingError(result);
      }
    } catch (error) {
      handleProcessingError(error);
    }
  }, [mode, handleProcessingSuccess, handleProcessingError]);

  // Start processing workflow
  const startProcessing = useCallback(async () => {
    if (!isMounted.current || processingStarted.current) return;
    
    processingStarted.current = true;
    console.log('[useImageProcessing] Starting processing workflow');
    
    // Clear image cache on iOS
    if (Platform.OS === 'ios') {
      try {
        await clearImageCache();
        performIOSMemoryCleanup();
      } catch (error) {
        console.warn('[useImageProcessing] Memory cleanup failed:', error);
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingProgress(0.1);
      setProcessingStatus('Uploading image...');
      
      // Upload image
      const uploadJobId = await uploadRoomImage(imageUri, mode);
      console.log('[useImageProcessing] Upload completed, jobId:', uploadJobId);
      
      setJobId(uploadJobId);
      setProcessingProgress(0.3);
      setProcessingStatus('Starting AI processing...');
      
      // Start polling
      await startPolling(uploadJobId);
      
    } catch (error) {
      console.error('[useImageProcessing] Upload error:', error);
      handleProcessingError(error);
      processingStarted.current = false;
    }
  }, [imageUri, mode, startPolling, handleProcessingError]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    processingStarted.current = false;
    setError(null);
    setLoading(true);
    setProcessingProgress(0);
    setProcessingStatus('Initializing...');
    startProcessing();
  }, [startProcessing]);

  // Handle style selection
  const handleStyleSelected = useCallback(async (styleId: DesignStyle) => {
    if (!jobId || stage !== 'styling') return;
    
    setSelectedDesignStyle(styleId);
    console.log('[useImageProcessing] Style selected:', styleId);
    
    try {
      setLoading(true);
      setProcessingProgress(0.2);
      setProcessingStatus(`Applying ${styleId} style...`);
      
      // Apply style
      await applyStyleToRoom(jobId, styleId);
      
      setProcessingProgress(0.3);
      setProcessingStatus(`Processing ${styleId} elements...`);
      
      // Start polling for style results
      await startPolling(jobId);
      
    } catch (error) {
      console.error('[useImageProcessing] Style processing error:', error);
      handleProcessingError(error);
    }
  }, [jobId, stage, startPolling, handleProcessingError]);

  // Retry style only (without re-uploading or re-processing empty room)
  const retryStyleOnly = useCallback(() => {
    if (stage !== 'styling' || !jobId || !selectedDesignStyle) {
      console.warn('[useImageProcessing] Cannot retry style - invalid state:', { stage, jobId, selectedDesignStyle });
      return;
    }
    
    console.log('[useImageProcessing] Retrying style application only:', selectedDesignStyle);
    setError(null);
    setLoading(true);
    setProcessingProgress(0.2);
    setProcessingStatus(`Retrying ${selectedDesignStyle} style...`);
    
    // Re-trigger the style application
    handleStyleSelected(selectedDesignStyle);
  }, [stage, jobId, selectedDesignStyle, handleStyleSelected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      processingStarted.current = false;
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Start processing on mount
  useEffect(() => {
    if (!processingStarted.current) {
      startProcessing();
    }
  }, []);

  const state: ProcessingState = {
    loading,
    processingStatus,
    processingProgress,
    originalUrl,
    processedUrl,
    error,
    jobId,
    selectedDesignStyle,
    stage,
    emptyRoomUrl,
  };

  const actions: ProcessingActions = {
    startProcessing,
    handleTryAgain,
    handleStyleSelected,
    retryStyleOnly,
  };

  return { state, actions };
}; 