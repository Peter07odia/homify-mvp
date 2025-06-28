import { SUPABASE_ANON_KEY_REF } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

// Environment configuration
const N8N_UNIFIED_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_UNIFIED_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/process-room-unified';
const N8N_SIMPLE_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_SIMPLE_WEBHOOK_URL || 'https://jabaranks7.app.n8n.cloud/webhook/process-room-unified';

export interface UnifiedProcessingRequest {
  imageUri: string;
  roomType: string;
  selectedStyle: string;
  quality: 'standard' | 'premium' | 'ultra';
  userId?: string;
  customPrompt?: string;
  preserveArchitecture?: boolean;
  mode?: 'simple' | 'complex'; // Add mode selection
}

export interface UnifiedProcessingResponse {
  success: boolean;
  jobId: string;
  status: 'completed' | 'error';
  message: string;
  originalImageUrl?: string;
  transformedImageUrl?: string; // For simple mode
  emptyRoomUrl?: string; // For complex mode
  styledRoomUrl?: string; // For complex mode
  appliedStyle?: string;
  roomType?: string;
  quality?: string;
  transformationPrompt?: string; // For simple mode
  preservedArchitecture?: boolean;
  redirectTo?: string;
  processingTime?: number;
  workflow?: string;
  estimatedTime?: string;
  error?: string;
}

/**
 * Start simplified processing workflow that intelligently transforms the room while preserving architecture
 * @param request Processing parameters
 * @returns Promise with processing results
 */
export const startSimpleProcessing = async (
  request: UnifiedProcessingRequest
): Promise<UnifiedProcessingResponse> => {
  try {
    console.log('🎨 [SimpleProcessing] Starting simplified room transformation:', {
      roomType: request.roomType,
      style: request.selectedStyle,
      quality: request.quality,
      customPrompt: request.customPrompt,
      preserveArchitecture: request.preserveArchitecture !== false,
      imageUri: request.imageUri.substring(0, 50) + '...'
    });

    // Use the Supabase Edge Function which will handle the simplified workflow
    const { EDGE_FUNCTION_URL } = await import('../lib/supabase');

    // Validate image exists
    const fileInfo = await FileSystem.getInfoAsync(request.imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Create form data for upload
    const formData = new FormData();
    
    // Add image file
    const fileName = request.imageUri.split('/').pop() || 'room.jpg';
    const mimeType = getMimeType(fileName);
    
    const fileBlob = {
      uri: request.imageUri,
      name: fileName,
      type: mimeType,
    };
    
    formData.append('file', fileBlob as any);
    formData.append('roomType', request.roomType);
    formData.append('selectedStyle', request.selectedStyle);
    formData.append('customPrompt', request.customPrompt || '');
    formData.append('quality', request.quality);
    formData.append('mode', 'simple'); // Use simplified mode
    
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
    };

    console.log('📡 Calling Supabase edge function for simplified processing...');

    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for simple processing

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Simple processing failed: ${response.status} - ${errorText}`);
      }

      const result: UnifiedProcessingResponse = await response.json();
      
      console.log('✅ Simple processing completed:', {
        success: result.success,
        status: result.status,
        jobId: result.jobId,
        workflow: result.workflow,
        hasTransformedImage: !!result.transformedImageUrl
      });

      return result;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Simple processing error:', error);
    
    return {
      success: false,
      jobId: '',
      status: 'error',
      message: `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Start unified processing workflow that creates both empty room and styled room (legacy complex mode)
 * @param request Processing parameters
 * @returns Promise with processing results
 */
export const startUnifiedProcessing = async (
  request: UnifiedProcessingRequest
): Promise<UnifiedProcessingResponse> => {
  try {
    console.log('🚀 [UnifiedProcessing] Starting unified processing:', {
      roomType: request.roomType,
      style: request.selectedStyle,
      quality: request.quality,
      imageUri: request.imageUri.substring(0, 50) + '...'
    });

    // Validate image exists
    const fileInfo = await FileSystem.getInfoAsync(request.imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(request.imageUri);
    console.log('📐 Image dimensions:', dimensions);

    // Generate unique job ID
    const jobId = `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create form data for upload
    const formData = new FormData();
    
    // Add image file
    const fileName = request.imageUri.split('/').pop() || 'room.jpg';
    const mimeType = getMimeType(fileName);
    
    const fileBlob = {
      uri: request.imageUri,
      name: fileName,
      type: mimeType,
    };
    
    formData.append('file', fileBlob as any);
    formData.append('jobId', jobId);
    formData.append('roomType', request.roomType);
    formData.append('selectedStyle', request.selectedStyle);
    formData.append('quality', request.quality);
    formData.append('imageWidth', dimensions.width.toString());
    formData.append('imageHeight', dimensions.height.toString());
    formData.append('timestamp', new Date().toISOString());
    
    if (request.userId) {
      formData.append('userId', request.userId);
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
    };

    console.log('📡 Calling unified processing webhook...');

    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for both processes

    try {
      const response = await fetch(N8N_UNIFIED_WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Unified processing failed: ${response.status} - ${errorText}`);
      }

      const result: UnifiedProcessingResponse = await response.json();
      
      console.log('✅ Unified processing completed:', {
        success: result.success,
        status: result.status,
        jobId: result.jobId,
        hasEmptyRoom: !!result.emptyRoomUrl,
        hasStyledRoom: !!result.styledRoomUrl
      });

      return result;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Unified processing error:', error);
    
    return {
      success: false,
      jobId: '',
      status: 'error',
      message: `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Get image dimensions
 */
const getImageDimensions = async (uri: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};

/**
 * Determine MIME type from filename
 */
const getMimeType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

/**
 * Style options with enhanced descriptions
 */
export const STYLE_OPTIONS = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean lines, neutral colors, uncluttered spaces',
    preview: '🏳️'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sleek furniture, bold shapes, contemporary art',
    preview: '🏢'
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Rich colors, layered textiles, eclectic mix',
    preview: '🌺'
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light wood, cozy textiles, hygge vibes',
    preview: '🌲'
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Exposed metal, raw textures, urban feel',
    preview: '🏭'
  },
  {
    id: 'botanical',
    name: 'Botanical',
    description: 'Abundant plants, natural materials, earth tones',
    preview: '🌿'
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    description: 'Rustic wood, vintage accessories, country charm',
    preview: '🏡'
  },
  {
    id: 'midcentury',
    name: 'Mid-Century',
    description: 'Retro furniture, warm wood, 1950s-60s style',
    preview: '🕰️'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'High-end materials, elegant finishes, sophisticated',
    preview: '💎'
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Light blues, natural textures, beach vibes',
    preview: '🌊'
  }
];

/**
 * Quality options
 */
export const QUALITY_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Good quality processing',
    price: 'Free'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Professional interior design quality',
    price: '$2.99'
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'Ultra-premium, magazine-worthy results',
    price: '$4.99'
  }
];

/**
 * Room type options
 */
export const ROOM_TYPE_OPTIONS = [
  {
    id: 'living_room',
    name: 'Living Room',
    icon: '🛋️'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: '🛏️'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: '🛁'
  },
  {
    id: 'dining_room',
    name: 'Dining Room',
    icon: '🍽️'
  },
  {
    id: 'office',
    name: 'Office',
    icon: '💻'
  }
]; 