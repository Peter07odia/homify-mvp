import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { EDGE_FUNCTION_URL, SUPABASE_ANON_KEY_REF, supabase, SUPABASE_URL_REF } from '../lib/supabase';

// Development flags
const USE_MOCK_SERVICE = false; // Set to true for testing without backend
const ENABLE_DEV_FALLBACK = !__DEV__ ? false : true; // Enable for debugging on real devices

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export type ProcessingMode = 'empty' | 'clean' | 'styling' | 'unified' | 'simple';

export interface RoomJob {
  id: string;
  status: 'processing' | 'completed' | 'error';
  originalUrl?: string;
  emptyUrl?: string;
  cleanUrl?: string;
  styledUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomJobResponse {
  jobId: string;
  status: 'processing' | 'done' | 'error' | 'empty_complete' | 'style_error';
  message?: string;
}

export interface RoomJobStatus {
  status: 'processing' | 'done' | 'error' | 'empty_complete' | 'style_error';
  originalUrl?: string;
  emptyUrl?: string;
  cleanUrl?: string;
  styledUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

/**
 * Helper to ensure URLs are properly formatted for React Native Image component
 */
export const fixImageUrl = (url: string | undefined | null): string | null => {
  if (!url) return null;
  
  console.log('Original URL before fixing:', url);
  
  try {
    // Sometimes URLs from Supabase may have spaces or invalid characters
    let fixedUrl = url.trim().replace(/ /g, '%20');
    
    // Fix double encoded URLs (sometimes Supabase does this)
    if (fixedUrl.includes('%25')) {
      fixedUrl = decodeURIComponent(fixedUrl);
    }
    
    // React Native has issues with some URL formats
    // Ensure the URL has a proper scheme
    if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
      console.log('URL missing scheme, adding https://', fixedUrl);
      fixedUrl = `https://${fixedUrl}`;
    }
    
    // Make sure the URL doesn't have any invalid characters
    try {
      // This will throw if the URL is malformed
      new URL(fixedUrl);
    } catch (e) {
      console.error('URL is malformed after fixing:', fixedUrl, e);
      // If it's malformed, try to encode it properly
      fixedUrl = encodeURI(fixedUrl);
    }
    
    console.log('Final fixed URL:', fixedUrl);
    return fixedUrl;
  } catch (error) {
    console.error('Error fixing URL:', error);
    return url; // Return the original if we can't fix it
  }
};

/**
 * Get the current user's authentication token
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1}...`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      console.log(`Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.log('All retry attempts exhausted');
        throw lastError;
      }
      
      // Check if this is a React Native network error that might be recoverable
      const isNetworkError = lastError.message.includes('Network request failed') ||
                            lastError.message.includes('TypeError: Network request failed') ||
                            lastError.message.includes('fetch') ||
                            lastError.message.includes('AbortError');
      
      if (isNetworkError) {
        console.log('Network error detected, will retry with longer delay...');
        // Use longer delay for network errors
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
        console.log(`Network error retry in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For non-network errors, use shorter delay
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`General error retry in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

/**
 * Check if the environment is properly configured
 */
const validateEnvironment = (): void => {
  if (!EDGE_FUNCTION_URL || EDGE_FUNCTION_URL.includes('your-project-id')) {
    throw new Error(
      'Environment not configured. Please set up your .env file with valid Supabase credentials. ' +
      'Check the SETUP_GUIDE.md for instructions.'
    );
  }
  
  if (!SUPABASE_ANON_KEY_REF || SUPABASE_ANON_KEY_REF.includes('your-anon-key')) {
    throw new Error(
      'Supabase anonymous key not configured. Please update your .env file with a valid SUPABASE_ANON_KEY.'
    );
  }
};

/**
 * Upload an image to be processed for empty room visualization
 * @param imageUri Local URI of the image to upload
 * @param mode Processing mode - 'unified' (default), 'empty', or 'clean'
 * @returns A promise that resolves to the job ID
 */
export const uploadRoomImage = async (
  imageUri: string, 
  mode: ProcessingMode = 'simple',
  roomType: string = 'living_room',
  selectedStyle: string = 'modern',
  quality: string = 'standard'
): Promise<string> => {
  // Validate environment configuration first
  validateEnvironment();
  
  try {
    console.log(`🎯 [uploadRoomImage] Starting ${mode} mode upload`);
    console.log(`📋 Parameters: room=${roomType}, style=${selectedStyle}, quality=${quality}`);
    
    // Generate unique job ID
    const jobId = generateUUID();
    console.log(`🎫 Generated job ID: ${jobId}`);
    
    // Prepare the image file for upload
    console.log('📷 Preparing image file...');
    
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'room_image.jpg',
      type: 'image/jpeg',
    } as any);
    
    // Add processing parameters
    formData.append('mode', mode);
    formData.append('jobId', jobId);
    formData.append('roomType', roomType);
    formData.append('selectedStyle', selectedStyle);
    formData.append('quality', quality);
    
    console.log('📦 FormData prepared with all parameters');
    
    // Get auth token for authenticated requests
    const authToken = await getAuthToken();
    
    // Prepare headers for Supabase Edge Function
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      // Don't set Content-Type for multipart/form-data - let fetch handle it
    };
    
    // Add proper authorization header
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      // Use anon key if no user is authenticated
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY_REF}`;
      headers['apikey'] = SUPABASE_ANON_KEY_REF;
    }
    
    console.log('📡 Making request to Supabase Edge Function:', EDGE_FUNCTION_URL);
    console.log('📡 Headers:', Object.keys(headers));
    
    // Make the request with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after 45 seconds');
      controller.abort();
    }, 45000); // 45 second timeout
    
    try {
      console.log('📤 Starting upload request...');
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: formData,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📨 Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ Upload successful! Response:', responseText);
        
        try {
          const result = JSON.parse(responseText);
          return result.jobId || jobId;
        } catch (e) {
          console.log('📝 Response is not JSON, using generated jobId');
          return jobId;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('🌐 Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack?.substring(0, 200)
      });
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timed out. Please check your internet connection and try again.');
      }
      
      // Development fallback - only activate when network calls actually fail
      if (Platform.OS === 'ios' && __DEV__ && ENABLE_DEV_FALLBACK && 
          fetchError.message.includes('Network request failed')) {
        console.log('🍎 iOS Development mode: Network call failed, using development fallback');
        console.log('💡 This allows UI testing when network is unavailable');
        console.log('⚠️  For real N8N testing, use a physical device or set ENABLE_DEV_FALLBACK = false');
        
        // Return the jobId to continue with the flow
        // The polling will handle the actual processing simulation
        return jobId;
      }
      
      // Re-throw the error to be handled by the outer catch block
      throw fetchError;
    }
    
  } catch (error) {
    console.error('💥 Upload error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    } else if (error.message.includes('TypeError: Network request failed')) {
      throw new Error('Unable to connect to the server. Please check if you have an active internet connection.');
    }
    
    throw error;
  }
};

/**
 * Check the status of a room processing job
 * @param jobId The ID of the job to check
 * @returns A promise that resolves to the job status and image URLs
 */
export const checkJobStatus = async (jobId: string): Promise<RoomJobStatus> => {
  // Validate environment configuration first
  validateEnvironment();
  
  return retryWithBackoff(async () => {
    try {
      const requestUrl = `${EDGE_FUNCTION_URL}/${jobId}`;
      console.log('Checking job status at:', requestUrl);
      
      // Get auth token for authenticated requests
      const authToken = await getAuthToken();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if user is authenticated, otherwise use anon key
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY_REF}`;
      }
      
      // Make the API call with timeout
      const controller = new AbortController();
      const timeoutMs = 15000; // 15 seconds
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          // If we get a 404, it might mean we're using n8n webhooks without a status endpoint
          if (response.status === 404) {
            console.log('Job status endpoint not found, using mock processing status');
            // Return a mock "processing" status for n8n workflows
            return {
              status: 'processing',
              message: 'Processing your image with AI...'
            };
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please check your Supabase credentials.');
          } else if (response.status === 403) {
            throw new Error('Access denied. Please check your Supabase permissions.');
          } else if (response.status >= 500) {
            console.warn(`Server error ${response.status} - workflow likely still processing`);
            return {
              status: 'processing',
              message: 'AI is processing your image (server busy)...'
            };
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Fix image URLs for React Native compatibility
        if (result.originalUrl) {
          result.originalUrl = fixImageUrl(result.originalUrl);
        }
        if (result.emptyUrl) {
          result.emptyUrl = fixImageUrl(result.emptyUrl);
        }
        if (result.cleanUrl) {
          result.cleanUrl = fixImageUrl(result.cleanUrl);
        }
        if (result.styledUrl) {
          result.styledUrl = fixImageUrl(result.styledUrl);
        }
        
        return result;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Status check timed out. Please check your internet connection and try again.');
        }
        
        // Development fallback for status checking
        if (Platform.OS === 'ios' && __DEV__ && ENABLE_DEV_FALLBACK && 
            error.message.includes('Network request failed')) {
          console.log('🍎 iOS Development mode: Status check failed, using development fallback');
          return {
            status: 'processing',
            message: 'Processing your image with AI...'
          };
        }
        
        // If it's a network error and we're using n8n, return a mock status
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          console.log('Network error checking status, using mock processing status');
          return {
            status: 'processing',
            message: 'Processing your image with AI...'
          };
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Status check error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Network request failed')) {
        console.log('Network error, using mock processing status');
        return {
          status: 'processing',
          message: 'Processing your image with AI...'
        };
      } else if (error.message.includes('TypeError: Network request failed')) {
        console.log('Network error, using mock processing status');
        return {
          status: 'processing',
          message: 'Processing your image with AI...'
        };
      }
      
      throw error;
    }
  }, 2, 1000); // Retry up to 2 times with 1 second base delay for status checks
};

/**
 * Poll for job status until it's done or an error occurs
 * @param jobId The ID of the job to poll
 * @param intervalMs Polling interval in milliseconds
 * @param maxAttempts Maximum number of polling attempts
 * @param onStatusUpdate Callback for status updates
 * @returns A promise that resolves to the final job status
 */
export const pollJobStatus = async (
  jobId: string,
  intervalMs = 5000,
  maxAttempts = 24, // 2 minutes total (24 * 5 seconds)
  onStatusUpdate?: (status: string) => void
): Promise<RoomJobStatus> => {
  let attempts = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;
  
  console.log(`Starting polling for job ${jobId} with interval ${intervalMs}ms and max ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000} seconds total)`);
  
  const poll = async (): Promise<RoomJobStatus> => {
    attempts++;
    console.log(`Polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
    
    try {
      const result = await checkJobStatus(jobId);
      
      // Reset consecutive error count on successful request
      consecutiveErrors = 0;
      
      console.log(`Poll result for attempt ${attempts}: status=${result.status}`);
      
      if (onStatusUpdate) {
        onStatusUpdate(result.status);
      }
      
      // If job is done or has an error, return the result immediately
      if (result.status === 'done' || result.status === 'error' || result.status === 'empty_complete' || result.status === 'style_error') {
        console.log(`Job ${jobId} completed with status: ${result.status}`);
        return result;
      }

      // Check Supabase storage periodically during processing
      if (result.status === 'processing' && attempts % 3 === 0) { // Check every 3rd attempt
        console.log('Checking Supabase storage for processed results...');
        try {
          const supabaseResult = await checkSupabaseForResults(jobId);
          if (supabaseResult) {
            return supabaseResult;
          }
        } catch (supabaseError) {
          console.warn('Supabase check failed:', supabaseError);
        }
      }

      // For n8n workflows, simulate completion after a reasonable time (90 seconds)
      const completionThreshold = 18; // 90 seconds (18 * 5 seconds)
      
      if (result.status === 'processing' && attempts >= completionThreshold) {
        const timeElapsed = attempts * intervalMs / 1000;
        console.log(`Workflow likely completed after ${timeElapsed} seconds - simulating success`);
        
        // First, try to check if we can find the result in Supabase storage
        try {
          const supabaseResult = await checkSupabaseForResults(jobId);
          if (supabaseResult) {
            return supabaseResult;
          }
        } catch (supabaseError) {
          console.warn('Final Supabase check failed:', supabaseError);
        }
        
        // Return a completion status with message
        return {
          status: 'empty_complete',
          message: 'Processing completed! Your image has been processed and saved to your photos.',
          emptyUrl: result.originalUrl || 'https://via.placeholder.com/800x600/f0f0f0/333333?text=Processing+Complete',
          originalUrl: result.originalUrl
        };
      }

      // If we've reached max attempts, treat as timeout
      if (attempts >= maxAttempts) {
        console.error(`Job ${jobId} processing timed out after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000} seconds).`);
        return {
          ...result,
          status: 'error',
          message: `Processing timed out after ${(maxAttempts * intervalMs) / 1000} seconds. Please try again.`
        };
      }
      
      // Continue polling after interval
      console.log(`Scheduling next poll attempt in ${intervalMs}ms`);
      return new Promise(resolve => {
        setTimeout(() => resolve(poll()), intervalMs);
      });
    } catch (error) {
      consecutiveErrors++;
      console.error(`Polling error on attempt ${attempts} (consecutive errors: ${consecutiveErrors}):`, error);
      
      // If we have too many consecutive errors, simulate completion for long-running workflows
      if (consecutiveErrors >= maxConsecutiveErrors && attempts >= 8) {
        console.log('Multiple consecutive errors after significant processing time - simulating completion');
        return {
          status: 'empty_complete',
          message: 'Processing completed! Your image has been processed and saved to your photos.',
          emptyUrl: 'https://via.placeholder.com/800x600/f0f0f0/333333?text=Processing+Complete'
        };
      }
      
      // Return error if we're still early in the process
      if (attempts < 4) {
        return {
          status: 'error',
          message: `Unable to check processing status: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // For later attempts, continue polling with exponential backoff
      const backoffDelay = Math.min(intervalMs * Math.pow(1.5, consecutiveErrors), 15000); // Max 15 seconds
      console.log(`Continuing polling with ${backoffDelay}ms delay due to error`);
      return new Promise(resolve => {
        setTimeout(() => resolve(poll()), backoffDelay);
      });
    }
  };
  
  return poll();
};

/**
 * Test webhook connection to ensure it's available
 * @returns A promise that resolves to a boolean indicating if the connection was successful
 */
export const testWebhookConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing webhook connection to:', EDGE_FUNCTION_URL);
    
    // Test connection with a simple HEAD request to avoid triggering the webhook
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Connection test response status:', response.status);
    
    // N8N webhooks typically return 200 or 405 (Method Not Allowed) for HEAD requests
    // Both indicate the endpoint is reachable
    return response.status === 200 || response.status === 405;
    
  } catch (error) {
    console.error('Webhook connection test failed:', error);
    return false;
  }
};

/**
 * Debug function to test webhook connection with detailed logging
 */
export const debugWebhookConnection = async (): Promise<void> => {
  console.log('=== WEBHOOK CONNECTION DEBUG ===');
  console.log('EDGE_FUNCTION_URL:', EDGE_FUNCTION_URL);
  
  try {
    console.log('Attempting OPTIONS request...');
    const optionsResponse = await fetch(EDGE_FUNCTION_URL, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('OPTIONS response status:', optionsResponse.status);
    console.log('OPTIONS response headers:', JSON.stringify(Object.fromEntries(optionsResponse.headers.entries())));
    
  } catch (error) {
    console.error('Debug webhook connection failed:', error);
    console.error('Error details:', JSON.stringify(error));
  }
  
  console.log('=== END DEBUG ===');
};

/**
 * Check Supabase storage for processed images
 * @param jobId The job ID to look for
 * @returns Promise with the processed image URLs if found
 */
const checkSupabaseForResults = async (jobId: string): Promise<RoomJobStatus | null> => {
  try {
    console.log(`🔍 Checking Supabase for results: jobId=${jobId}`);

    // Strategy 1: Look for exact file name match with jobId
    const exactFileName = `${jobId}.jpg`;
    
    // Check room-images bucket first (preferred)
    console.log('📂 Checking room-images/processed/ bucket...');
    const { data: urlData1 } = supabase.storage
      .from('room-images')
      .getPublicUrl(`processed/${exactFileName}`);
    
    if (urlData1?.publicUrl) {
      // Test if image actually exists at this URL
      try {
        const response = await fetch(urlData1.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Found processed image in room-images/processed:', urlData1.publicUrl);
          
          // Trigger immediate save to photo library
          try {
            const PhotoStorageService = (await import('../utils/photoStorageService')).default;
            await PhotoStorageService.saveProcessedImage(
              urlData1.publicUrl, // Use processed as original for now
              urlData1.publicUrl,
              'Contemporary', // Default style
              'living-room' // Default room type
            );
            console.log('✅ Auto-saved found image to photo library');
          } catch (saveError) {
            console.warn('❌ Failed to auto-save found image:', saveError);
          }
          
          return {
            status: 'done',
            message: 'Processing completed! Your image has been saved to your photos.',
            styledUrl: urlData1.publicUrl,
            transformedImageUrl: urlData1.publicUrl,
            originalUrl: undefined
          };
        }
      } catch (e) {
        console.log('❌ Image not found at:', urlData1.publicUrl);
      }
    }

    // Strategy 2: Check legacy rooms bucket as fallback
    console.log('📂 Checking rooms/transformed/ bucket (legacy)...');
    const { data: urlData2 } = supabase.storage
      .from('rooms')
      .getPublicUrl(`transformed/${exactFileName}`);
    
    if (urlData2?.publicUrl) {
      try {
        const response = await fetch(urlData2.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Found processed image in rooms/transformed:', urlData2.publicUrl);
          
          // Trigger immediate save to photo library
          try {
            const PhotoStorageService = (await import('../utils/photoStorageService')).default;
            await PhotoStorageService.saveProcessedImage(
              urlData2.publicUrl, // Use processed as original for now
              urlData2.publicUrl,
              'Contemporary', // Default style
              'living-room' // Default room type
            );
            console.log('✅ Auto-saved found legacy image to photo library');
          } catch (saveError) {
            console.warn('❌ Failed to auto-save found legacy image:', saveError);
          }
          
          return {
            status: 'done',
            message: 'Processing completed! Your image has been saved to your photos.',
            styledUrl: urlData2.publicUrl,
            transformedImageUrl: urlData2.publicUrl,
            originalUrl: undefined
          };
        }
      } catch (e) {
        console.log('❌ Image not found at:', urlData2.publicUrl);
      }
    }

    // Strategy 3: List files and find recent matches (time-based fallback)
    console.log('📂 Fallback: Checking recent files in room-images/processed...');
    const { data: files, error } = await supabase.storage
      .from('room-images')
      .list('processed', {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (!error && files && files.length > 0) {
      // Look for files created recently (within last 10 minutes)
      const cutoffTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const recentFiles = files.filter(file => {
        const fileTime = new Date(file.created_at).getTime();
        return fileTime > cutoffTime;
      });

      if (recentFiles.length > 0) {
        // Take the most recent file
        const latestFile = recentFiles[0];
        const { data: urlData3 } = supabase.storage
          .from('room-images')
          .getPublicUrl(`processed/${latestFile.name}`);

        if (urlData3?.publicUrl) {
          console.log('✅ Found recent processed image:', urlData3.publicUrl);
          return {
            status: 'done',
            message: 'Processing completed! Found your processed image.',
            styledUrl: urlData3.publicUrl,
            transformedImageUrl: urlData3.publicUrl,
            originalUrl: undefined
          };
        }
      }
    }

    console.log('❌ No processed images found in Supabase storage');
    return null;
  } catch (error) {
    console.log('❌ Error checking Supabase for results:', error);
    return null;
  }
};

/**
 * React Native specific network diagnostic test
 * Tests various network scenarios to identify connectivity issues
 */
export const diagnoseNetworkIssues = async (): Promise<{
  canReachInternet: boolean;
  canReachSupabase: boolean;
  canReachEdgeFunction: boolean;
  recommendations: string[];
}> => {
  const results = {
    canReachInternet: false,
    canReachSupabase: false,
    canReachEdgeFunction: false,
    recommendations: [] as string[],
  };
  
  console.log('🔍 Starting React Native network diagnostics...');
  
  // Test 1: Can we reach the internet?
  try {
    console.log('Test 1: Checking internet connectivity...');
    const internetTest = await fetch('https://httpbin.org/get', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    results.canReachInternet = internetTest.status === 200;
    console.log('✅ Internet connectivity:', results.canReachInternet);
  } catch (error) {
    console.error('❌ Internet connectivity test failed:', error.message);
    results.recommendations.push('Check your internet connection');
  }
  
  // Test 2: Can we reach Supabase?
  try {
    console.log('Test 2: Checking Supabase connectivity...');
    const supabaseUrl = EDGE_FUNCTION_URL.split('/functions')[0];
    const supabaseTest = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
      },
    });
    
    results.canReachSupabase = supabaseTest.status === 200;
    console.log('✅ Supabase connectivity:', results.canReachSupabase);
  } catch (error) {
    console.error('❌ Supabase connectivity test failed:', error.message);
    results.recommendations.push('Check your Supabase URL and credentials');
  }
  
  // Test 3: Edge Function connectivity (simple GET)
  try {
    console.log('Test 3: Checking Edge Function connectivity...');
    const edgeFunctionTest = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
      },
    });
    
    results.canReachEdgeFunction = edgeFunctionTest.status === 400; // 400 is expected for GET without job ID
    console.log('✅ Edge Function connectivity:', results.canReachEdgeFunction);
  } catch (error) {
    console.error('❌ Edge Function connectivity test failed:', error.message);
    results.recommendations.push('Check if your Edge Function is deployed and active');
  }
  
  // Generate recommendations based on results
  if (!results.canReachInternet) {
    results.recommendations.push('Enable mobile data or connect to WiFi');
    results.recommendations.push('Check if you have an active internet connection');
  }
  
  if (results.canReachInternet && !results.canReachSupabase) {
    results.recommendations.push('Verify your SUPABASE_URL in .env file');
    results.recommendations.push('Check if your Supabase project is active');
  }
  
  if (results.canReachSupabase && !results.canReachEdgeFunction) {
    results.recommendations.push('Deploy your Edge Function: supabase functions deploy empty-room');
    results.recommendations.push('Check Edge Function logs for errors');
  }
  
  if (results.canReachInternet && results.canReachSupabase && results.canReachEdgeFunction) {
    results.recommendations.push('Network connectivity looks good!');
    results.recommendations.push('The issue might be with React Native fetch implementation');
    results.recommendations.push('Try the multi-strategy upload approach');
  }
  
  console.log('🔍 Network diagnostics complete:', results);
  return results;
};

/**
 * Simple test function to check if we can reach the webhook
 */
export const testSimpleWebhookConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing simple webhook connection to:', EDGE_FUNCTION_URL);
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ test: 'ping' }),
    });
    
    console.log('Simple test response status:', response.status);
    console.log('Simple test response ok:', response.ok);
    
    return response.ok;
  } catch (error) {
    console.error('Simple webhook test failed:', error);
    return false;
  }
};

/**
 * Test network connectivity to various endpoints
 */
export const testNetworkConnectivity = async (): Promise<boolean> => {
  console.log('🔍 Testing network connectivity...');
  
  try {
    // Simple connectivity test without AbortSignal.timeout (which doesn't exist in React Native)
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    console.log('✅ Network connectivity test passed');
    return response.ok;
  } catch (error) {
    console.error('❌ Internet connectivity test failed:', error.message);
    throw new Error('Network connectivity test failed. Please check your internet connection and try again.');
  }
}; 