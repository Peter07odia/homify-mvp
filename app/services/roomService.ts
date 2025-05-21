import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { EDGE_FUNCTION_URL } from '../lib/supabase';

export type ProcessingMode = 'empty' | 'clean';

export interface RoomJobResponse {
  jobId: string;
  status: 'processing' | 'done' | 'error';
  message?: string;
}

export interface RoomJobStatus {
  status: 'processing' | 'done' | 'error';
  originalUrl?: string;
  emptyUrl?: string;
  cleanUrl?: string;
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
    console.log(`Checking job status for ID: ${jobId}`);
    const requestUrl = `${EDGE_FUNCTION_URL}/${jobId}`;
    console.log(`Making GET request to: ${requestUrl}`);
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log(`Status check response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Status check failed: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      const responseText = await response.text();
      console.error('Raw response text:', responseText);
      throw new Error(`Invalid JSON in response: ${responseText.substring(0, 100)}...`);
    }
    
    console.log(`Job status response: ${JSON.stringify(responseData)}`);
    
    // HACK: If your n8n workflow is setting the empty_path but the edge function isn't 
    // returning the emptyUrl, try to manually construct it here.
    if (responseData.status === 'done' && !responseData.emptyUrl && !responseData.cleanUrl) {
      console.log('No URLs in response, trying to manually construct the URL');
      
      // Check if we're in a Supabase environment (assuming your URL format)
      if (EDGE_FUNCTION_URL.includes('supabase.co')) {
        // Parse out the project ID from the edge function URL
        const projectId = EDGE_FUNCTION_URL.split('https://')[1].split('.supabase.co')[0];
        
        if (projectId) {
          const baseStorageUrl = `https://${projectId}.supabase.co/storage/v1/object/public/rooms/`;
          
          // Manually construct the empty URL
          responseData.emptyUrl = `${baseStorageUrl}empty/${jobId}.jpg`;
          console.log('Manually constructed emptyUrl:', responseData.emptyUrl);
          
          // Manually construct the clean URL for clean mode (if needed)
          responseData.cleanUrl = `${baseStorageUrl}clean/${jobId}.jpg`;
          console.log('Manually constructed cleanUrl:', responseData.cleanUrl);
        }
      }
    }
    
    // Ensure the response has a valid status field
    if (!responseData.status) {
      console.error('Response missing status field:', responseData);
      throw new Error('Invalid response format: missing status field');
    }
    
    return responseData;
  } catch (error) {
    console.error('Status check error:', error);
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
  intervalMs = 2000,
  maxAttempts = 15,
  onStatusUpdate?: (status: string) => void
): Promise<RoomJobStatus> => {
  let attempts = 0;
  
  console.log(`Starting polling for job ${jobId} with interval ${intervalMs}ms and max ${maxAttempts} attempts`);
  
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
      if (result.status === 'done' || result.status === 'error') {
        console.log(`Job ${jobId} completed with status: ${result.status}`);
        return result;
      }

      // If we've reached max attempts and status is still 'processing', treat as timeout error
      if (attempts >= maxAttempts) {
        console.error(`Job ${jobId} processing timed out after ${maxAttempts} attempts.`);
        return {
          ...result,
          status: 'error',
          message: `Processing timed out after ${maxAttempts * intervalMs / 1000} seconds. The n8n workflow may be overloaded or failing.`
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