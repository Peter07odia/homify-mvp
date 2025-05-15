import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EDGE_FUNCTION_URL } from '../lib/supabase';

export type ProcessingMode = 'empty' | 'upstyle';

export interface RoomJobResponse {
  jobId: string;
  status: 'processing' | 'done' | 'error';
  message?: string;
}

export interface RoomJobStatus {
  status: 'processing' | 'done' | 'error';
  originalUrl?: string;
  emptyUrl?: string;
  upstyleUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Upload an image to be processed for empty room visualization
 * @param imageUri Local URI of the image to upload
 * @param mode Processing mode - 'empty' (default) or 'upstyle'
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
    
    // Create file name from URI
    const fileName = imageUri.split('/').pop() || 'room.jpg';
    
    // Handle Android content:// URIs
    const fileToUpload = Platform.OS === 'ios' ? imageUri : imageUri;
    
    // Append the file to form data
    formData.append('file', {
      uri: fileToUpload,
      name: fileName,
      type: 'image/jpeg', // Assuming JPEG, adjust as needed
    } as any);
    
    // Add the processing mode
    formData.append('mode', mode);
    
    // Make the API call
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json() as RoomJobResponse;
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
    const response = await fetch(`${EDGE_FUNCTION_URL}/${jobId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
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
  maxAttempts = 30,
  onStatusUpdate?: (status: string) => void
): Promise<RoomJobStatus> => {
  let attempts = 0;
  
  const poll = async (): Promise<RoomJobStatus> => {
    attempts++;
    
    try {
      const result = await checkJobStatus(jobId);
      
      if (onStatusUpdate) {
        onStatusUpdate(result.status);
      }
      
      if (result.status === 'done' || result.status === 'error' || attempts >= maxAttempts) {
        return result;
      }
      
      // Continue polling after interval
      return new Promise(resolve => {
        setTimeout(() => resolve(poll()), intervalMs);
      });
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  };
  
  return poll();
}; 