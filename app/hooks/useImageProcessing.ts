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

export const useImageProcessing = (
  imageUri: string, 
  mode: 'empty' | 'clean' | 'unified' | 'simple' = 'simple',
  roomType?: string,
  selectedStyle?: string,
  quality?: string,
  customPrompt?: string
) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isMounted = useRef(true);
  const processingStarted = useRef(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<DesignStyle>('modern');
  const [stage, setStage] = useState<'empty' | 'styling' | 'complete'>('empty');
  const [emptyRoomUrl, setEmptyRoomUrl] = useState<string | null>(null);

  // Clear timeouts
  const clearTimeouts = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Handle successful processing results
  const handleProcessingSuccess = useCallback(async (result: any) => {
    if (!isMounted.current) return;
    
    console.log('[useImageProcessing] Processing success:', result);
    setProcessingProgress(1.0);
    
    // Import services dynamically
    const PhotoStorageService = (await import('../utils/photoStorageService')).default;
    const NotificationService = (await import('../utils/notificationService')).default;
    
    // Handle simple workflow results (transformed image)
    if (result.transformedImageUrl || result.styledUrl) {
      const transformedUrl = result.transformedImageUrl || result.styledUrl;
      const originalUrl = result.originalImageUrl || result.originalUrl || imageUri;
      
      console.log('[useImageProcessing] Simple workflow completed successfully');
      setProcessingStatus('Your transformed room is ready!');
      
      // Map style names for navigation
      const styleOptions: Record<string, string> = {
        'minimal': 'Minimal',
        'modern': 'Modern', 
        'botanical': 'Botanical',
        'scandinavian': 'Scandinavian',
        'industrial': 'Industrial',
        'bohemian': 'Bohemian',
        'contemporary': 'Contemporary',
        'classic': 'Classic',
        'farmhouse': 'Farmhouse',
        'mediterranean': 'Mediterranean'
      };
      const styleLabel = styleOptions[selectedStyle || selectedDesignStyle] || selectedStyle || selectedDesignStyle || 'Contemporary';
      
      // Save to photo storage only (no auto-save to device library)
      try {
        await PhotoStorageService.saveProcessedImage(
          imageUri,
          transformedUrl,
          styleLabel,
          roomType || 'living-room'
        );
        console.log('✅ [useImageProcessing] Photo saved to storage');
      } catch (storageError) {
        console.warn('❌ Failed to save to photo storage:', storageError);
        // Still show notification even if storage fails
        const NotificationService = (await import('../utils/notificationService')).default;
        await NotificationService.showProcessingCompleteNotification(styleLabel);
      }
      
      // Navigate to styled room screen
      console.log('[useImageProcessing] Navigating to StyledRoom with:', {
        originalImageUri: imageUri ? imageUri.substring(0, 50) + '...' : 'undefined',
        emptyRoomUrl: originalUrl ? originalUrl.substring(0, 50) + '...' : 'undefined',
        styledRoomUrl: transformedUrl ? transformedUrl.substring(0, 50) + '...' : 'undefined',
        styleLabel
      });
      
      navigation.navigate('StyledRoom', {
        originalImageUri: imageUri,
        emptyRoomUrl: originalUrl,
        styledRoomUrl: transformedUrl,
        styleLabel: styleLabel,
        autoRoute: true // Enable auto-routing for new processing results
      });
      
      setStage('complete');
      setLoading(false);
      setError(null);
      return;
    }
    
    // Handle legacy complex workflow results
    if (stage === 'empty' && (result.emptyUrl || result.cleanUrl)) {
      const emptyRoomUrl = result.emptyUrl || result.cleanUrl;
      console.log('[useImageProcessing] Empty room ready:', emptyRoomUrl);
      setEmptyRoomUrl(emptyRoomUrl);
      setProcessingStatus('Room cleaned successfully!');
      setStage('styling');
      setLoading(false);
    } else if (stage === 'styling' && result.styledUrl) {
      console.log('[useImageProcessing] Styling complete:', result.styledUrl);
      setProcessedUrl(result.styledUrl);
      setProcessingStatus('Room styling complete!');
      
      // Map style names for navigation
      const styleOptions: Record<string, string> = {
        'minimal': 'Minimal',
        'modern': 'Modern', 
        'botanical': 'Botanical',
        'scandinavian': 'Scandinavian',
        'industrial': 'Industrial',
        'bohemian': 'Bohemian'
      };
      const styleLabel = styleOptions[selectedDesignStyle] || selectedDesignStyle;
      
      // Navigate to styled room screen
      navigation.navigate('StyledRoom', {
        originalImageUri: imageUri,
        emptyRoomUrl: emptyRoomUrl || result.emptyUrl,
        styledRoomUrl: result.styledUrl,
        styleLabel: styleLabel,
        autoRoute: true // Enable auto-routing for new processing results
      });
      
      setStage('complete');
      setLoading(false);
    } else {
      console.warn('[useImageProcessing] No transformed/styled URL found in result:', result);
      handleProcessingError('No styled image was generated. Please try again.');
    }
    
    setError(null);
    clearTimeouts();
  }, [stage, clearTimeouts, selectedDesignStyle, selectedStyle, navigation, imageUri, emptyRoomUrl]);

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
        await handleProcessingSuccess(result);
      } else if (result.status === 'empty_complete') {
        await handleProcessingSuccess(result);
      } else if (result.status === 'error' || result.status === 'style_error') {
        handleProcessingError(result);
      }
    } catch (error) {
      handleProcessingError(error);
    }
  }, [mode, handleProcessingSuccess, handleProcessingError]);

  // Start processing workflow
  const startProcessing = useCallback(async () => {
    console.log('[useImageProcessing] startProcessing called');
    console.log('[useImageProcessing] Current state:', {
      isMounted: isMounted.current,
      processingStarted: processingStarted.current,
      loading,
      stage,
      mode,
      roomType,
      selectedStyle,
      quality,
      customPrompt
    });
    
    if (!isMounted.current || processingStarted.current) {
      console.log('[useImageProcessing] Skipping processing - already started or unmounted');
      return;
    }
    
    processingStarted.current = true;
    
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
      
      if (mode === 'simple') {
        // Use simplified processing workflow
        console.log('[useImageProcessing] Starting simplified processing workflow');
        
        const { startSimpleProcessing } = await import('../services/unifiedProcessingService');
        
        const result = await startSimpleProcessing({
          imageUri,
          roomType: roomType || 'living-room',
          selectedStyle: selectedStyle || 'contemporary',
          quality: (quality === 'SD' ? 'standard' : quality === 'HD' ? 'premium' : 'ultra') as 'standard' | 'premium' | 'ultra',
          customPrompt: customPrompt || '',
          preserveArchitecture: true,
          mode: 'simple'
        });
        
        console.log('[useImageProcessing] Simple processing result:', result);
        
        // Check if processing was successful
        if (result.success) {
          if (result.status === 'completed' && result.transformedImageUrl) {
            // Processing completed successfully
            console.log('[useImageProcessing] Simple processing completed successfully');
            setProcessingProgress(1.0);
            setProcessingStatus('Your transformed room is ready!');
            
            // Save to photo storage only (no auto-save to device library)
            try {
              const PhotoStorageService = (await import('../utils/photoStorageService')).default;
              
              await PhotoStorageService.saveProcessedImage(
                imageUri,
                result.transformedImageUrl,
                selectedStyle || 'Contemporary',
                roomType || 'living-room'
              );
              console.log('✅ [useImageProcessing] Simple processing - photo saved to storage');
            } catch (storageError) {
              console.warn('❌ Failed to save to photo storage:', storageError);
              // Still show notification even if storage fails
              const NotificationService = (await import('../utils/notificationService')).default;
              await NotificationService.showProcessingCompleteNotification(selectedStyle || 'Contemporary');
            }
            
            // Navigate to styled room screen with transformed image
            console.log('[useImageProcessing] Simple processing - Navigating to StyledRoom with:', {
              originalImageUri: imageUri ? imageUri.substring(0, 50) + '...' : 'undefined',
              emptyRoomUrl: (result.originalImageUrl || imageUri) ? (result.originalImageUrl || imageUri).substring(0, 50) + '...' : 'undefined',
              styledRoomUrl: result.transformedImageUrl ? result.transformedImageUrl.substring(0, 50) + '...' : 'undefined',
              styleLabel: selectedStyle || 'Contemporary'
            });
            
            navigation.navigate('StyledRoom', {
              originalImageUri: imageUri,
              emptyRoomUrl: result.originalImageUrl || imageUri,
              styledRoomUrl: result.transformedImageUrl,
              styleLabel: selectedStyle || 'Contemporary',
              autoRoute: true // Enable auto-routing for new processing results
            });
            
            setStage('complete');
            setLoading(false);
            setError(null);
          } else if (result.status === 'processing') {
            // Processing started successfully, poll for results
            console.log('[useImageProcessing] Simple processing started, beginning polling for job:', result.jobId);
            setJobId(result.jobId);
            setProcessingProgress(0.3);
            setProcessingStatus('Transforming your room with AI...');
            
            // Start polling for results
            await startPolling(result.jobId);
          } else {
            throw new Error(result.message || 'Processing returned unexpected status');
          }
        } else {
          throw new Error(result.message || result.error || 'Simple processing failed');
        }
        
      } else {
        // Use legacy unified processing workflow
        console.log('[useImageProcessing] Starting unified processing workflow');
        
        const uploadJobId = await uploadRoomImage(
          imageUri, 
          'simple', // Changed from 'unified' to 'simple'
          roomType || 'living_room', // Use provided room type
          selectedDesignStyle || 'modern', // Use selected style
          'standard' // Default quality
        );
        console.log('[useImageProcessing] Unified upload completed, jobId:', uploadJobId);
        
        // Ensure we have a valid jobId before proceeding
        if (!uploadJobId) {
          throw new Error('Upload failed - no job ID returned');
        }
        
        setJobId(uploadJobId);
        setProcessingProgress(0.3);
        setProcessingStatus('Processing with AI...');
        
        // Start polling for unified results
        await startPolling(uploadJobId);
      }
      
    } catch (error) {
      console.error('[useImageProcessing] Processing error:', error);
      handleProcessingError(error);
      processingStarted.current = false;
    }
  }, [imageUri, selectedDesignStyle, startPolling, handleProcessingError, mode, roomType, selectedStyle, quality, customPrompt, navigation]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    processingStarted.current = false;
    setError(null);
    setLoading(true);
    setProcessingProgress(0);
    setProcessingStatus('Initializing...');
    startProcessing();
  }, [startProcessing]);

  // Handle style selection - DISABLED for unified workflow
  const handleStyleSelected = useCallback(async (styleId: DesignStyle) => {
    console.log('[useImageProcessing] handleStyleSelected called but disabled for unified workflow:', styleId);
    console.warn('[useImageProcessing] Style selection is disabled - using unified processing instead');
    
    // Since we're using unified processing, style selection happens during initial upload
    // This function is kept for backward compatibility but does nothing
    return;
    
    /* DISABLED - Separate style application not needed with unified workflow
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
    */
  }, []);

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
  // useEffect(() => {
  //   if (!processingStarted.current) {
  //     startProcessing();
  //   }
  // }, []);

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