import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { EDGE_FUNCTION_URL, SUPABASE_ANON_KEY_REF } from '../lib/supabase';

// Development flag to use mock service
const USE_MOCK_SERVICE = false; // Set to true for testing without backend

export type ProcessingMode = 'empty' | 'clean' | 'styling';

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
 * Upload an image to be processed for empty room visualization
 * @param imageUri Local URI of the image to upload
 * @param mode Processing mode - 'empty' (default) or 'clean'
 * @returns A promise that resolves to the job ID
 */
export const uploadRoomImage = async (
  imageUri: string, 
  mode: ProcessingMode = 'empty'
): Promise<string> => {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    console.log('File info:', JSON.stringify(fileInfo));
    
    // Get image dimensions
    const getImageDimensions = async (uri: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve, reject) => {
        Image.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          (error) => reject(error)
        );
      });
    };
    
    // Get dimensions of the image
    const dimensions = await getImageDimensions(imageUri);
    console.log('Image dimensions:', dimensions);
    
    // Create file name from URI
    const fileName = imageUri.split('/').pop() || 'room.jpg';
    
    // Determine the mime type
    let mimeType = 'image/jpeg'; // Default to JPEG
    if (fileName.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (fileName.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    // Append the file to form data with proper structure
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    
    // Add the processing mode
    formData.append('mode', mode);
    
    // Add image dimensions to form data
    formData.append('imageWidth', dimensions.width.toString());
    formData.append('imageHeight', dimensions.height.toString());
    
    console.log('Uploading image to:', EDGE_FUNCTION_URL);
    console.log('Mode:', mode);
    console.log('File name:', fileName);
    console.log('Image dimensions:', `${dimensions.width}x${dimensions.height}`);
    
    // Make the API call
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Read response text first to ensure we can log it
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Upload response error:', responseText);
      
      // Try to parse the response as JSON
      let errorData = responseText;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        // If parsing fails, keep the original text
      }
      
      throw new Error(`API error: ${response.status} - ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`);
    }
    
    // Parse the successful response
    let result;
    try {
      result = JSON.parse(responseText) as RoomJobResponse;
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error(`Invalid response format: ${responseText}`);
    }
    
    return result.jobId;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Check the status of a room processing job
 * @param jobId The ID of the job to check
 * @returns A promise that resolves to the job status and image URLs
 */
export const checkJobStatus = async (jobId: string): Promise<RoomJobStatus> => {
  try {
    const requestUrl = `${EDGE_FUNCTION_URL}/${jobId}`;
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    console.log('[checkJobStatus] Raw response data:', JSON.stringify(responseData, null, 2));
    
    // Fix any malformed URLs
    if (responseData.emptyUrl) {
      responseData.emptyUrl = fixImageUrl(responseData.emptyUrl);
    }
    if (responseData.cleanUrl) {
      responseData.cleanUrl = fixImageUrl(responseData.cleanUrl);
    }
    if (responseData.styledUrl) {
      responseData.styledUrl = fixImageUrl(responseData.styledUrl);
    }

    console.log('[checkJobStatus] Status:', responseData.status, 'URLs:', {
      emptyUrl: responseData.emptyUrl ? 'present' : 'null',
      cleanUrl: responseData.cleanUrl ? 'present' : 'null', 
      styledUrl: responseData.styledUrl ? 'present' : 'null'
    });
    
    return responseData;
  } catch (error) {
    console.error('Error checking job status:', error);
    throw error;
  }
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
  maxAttempts = 20,
  onStatusUpdate?: (status: string) => void
): Promise<RoomJobStatus> => {
  let attempts = 0;
  
  console.log(`Starting polling for job ${jobId} with interval ${intervalMs}ms and max ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000} seconds total)`);
  
  const poll = async (): Promise<RoomJobStatus> => {
    attempts++;
    console.log(`Polling attempt ${attempts}/${maxAttempts} for job ${jobId}`);
    
    try {
      const result = await checkJobStatus(jobId);
      
      console.log(`Poll result for attempt ${attempts}: status=${result.status}`);
      
      if (onStatusUpdate) {
        onStatusUpdate(result.status);
      }
      
      // If job is done or has an error, return the result immediately
      if (result.status === 'done' || result.status === 'error' || result.status === 'empty_complete' || result.status === 'style_error') {
        console.log(`Job ${jobId} completed with status: ${result.status}`);
        return result;
      }

      // If we've reached max attempts and status is still 'processing', treat as timeout error
      if (attempts >= maxAttempts) {
        console.error(`Job ${jobId} processing timed out after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000} seconds).`);
        return {
          ...result,
          status: 'error',
          message: `Processing timed out after ${(maxAttempts * intervalMs) / 1000} seconds. Your n8n workflow may need more time or be failing.`
        };
      }
      
      // Continue polling after interval
      console.log(`Scheduling next poll attempt in ${intervalMs}ms`);
      return new Promise(resolve => {
        setTimeout(() => resolve(poll()), intervalMs);
      });
    } catch (error) {
      console.error(`Polling error on attempt ${attempts}:`, error);
      // Return an error result instead of throwing
      return {
        status: 'error',
        message: `Error checking job status: ${error instanceof Error ? error.message : String(error)}`
      };
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