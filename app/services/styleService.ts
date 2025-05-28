import { ProcessingMode } from './roomService';
import { uploadRoomImage } from './roomService';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { STYLE_WEBHOOK_URL_REF as STYLE_WEBHOOK_URL } from '../lib/supabase';

// Add this to your types definitions
export type DesignStyle = 
  | 'minimal'
  | 'modern'
  | 'bohemian'
  | 'scandinavian'
  | 'industrial'
  | 'botanical'
  | 'farmhouse'
  | 'midcentury'
  | null;

// Style data structure - matches the one in StyleSelectionComponent
export const DESIGN_STYLES = [
  {
    id: 'minimal',
    title: 'Minimal',
    description: 'Clean, simple, uncluttered',
    color: '#F5F5F5',
  },
  {
    id: 'modern',
    title: 'Modern',
    description: 'Sleek, current, innovative',
    color: '#E0E0E0',
  },
  {
    id: 'bohemian',
    title: 'Bohemian',
    description: 'Eclectic, relaxed, colorful',
    color: '#FFF0DB',
  },
  {
    id: 'scandinavian',
    title: 'Scandinavian',
    description: 'Light, airy, functional',
    color: '#F9F9F9',
  },
  {
    id: 'industrial',
    title: 'Industrial',
    description: 'Raw, edgy, utilitarian',
    color: '#E8E8E8',
  },
  {
    id: 'botanical',
    title: 'Botanical',
    description: 'Natural, green, tranquil',
    color: '#E8F5E9',
  },
  {
    id: 'farmhouse',
    title: 'Farmhouse',
    description: 'Rustic, cozy, traditional',
    color: '#F5F3E8',
  },
  {
    id: 'midcentury',
    title: 'Mid-Century',
    description: 'Retro, clean lines, organic',
    color: '#FFF8E1',
  },
];

// Store the user's selected style preference
let userPreferredStyle: DesignStyle = null;

/**
 * Set the user's preferred design style
 * @param styleId The ID of the preferred style
 */
export const setUserPreferredStyle = (styleId: DesignStyle) => {
  userPreferredStyle = styleId;
  // Here you could also persist this to AsyncStorage if needed
};

/**
 * Get the user's preferred design style
 * @returns The user's preferred style ID
 */
export const getUserPreferredStyle = (): DesignStyle => {
  return userPreferredStyle;
};

/**
 * Get the description for a given design style
 * @param styleId The style ID to look up
 * @returns The style description or null if not found
 */
export const getStyleDescription = (styleId: DesignStyle): string | null => {
  if (!styleId) return null;
  const style = DESIGN_STYLES.find(style => style.id === styleId);
  return style ? style.description : null;
};

/**
 * Prepares design style parameters for API calls
 * Can be used without modifying existing uploadRoomImage function
 * @param formData Existing FormData object
 * @param designStyle Optional design style to append
 * @returns Updated FormData with style parameters
 */
export const appendStyleParameters = (
  formData: FormData,
  designStyle: DesignStyle = null
): FormData => {
  // Use provided style or fall back to user preference
  const styleToUse = designStyle || userPreferredStyle;
  
  if (styleToUse) {
    formData.append('designStyle', styleToUse);
    console.log('Added design style to request:', styleToUse);
  }
  
  return formData;
};

/**
 * Feature flag to enable/disable the style selection feature
 * Helps with easy rollback if needed
 */
export const isStyleSelectionEnabled = (): boolean => {
  // This could be configured from a remote config service
  // or toggled in dev settings
  return false; // DISABLED - Skip style selection and go directly to empty room processing
};

/**
 * Generate loading messages specific to the chosen design style
 * @param styleId The style ID
 * @param mode The processing mode (empty or clean)
 * @returns Array of loading messages tailored to the style
 */
export const getStyleSpecificLoadingMessages = (
  styleId: DesignStyle,
  mode: ProcessingMode
): string[] => {
  if (!styleId) {
    return [
      `${mode === 'empty' ? 'Removing furniture' : 'Decluttering room'}...`,
      'Processing image...',
      'Almost done...'
    ];
  }
  
  // Style-specific messages
  const baseMessages: Record<Exclude<DesignStyle, null>, string[]> = {
    minimal: [
      'Creating clean lines...',
      'Refining minimal space...',
      'Perfecting simplicity...'
    ],
    modern: [
      'Designing contemporary space...',
      'Adding modern elements...',
      'Crafting sleek aesthetics...'
    ],
    bohemian: [
      'Infusing eclectic vibes...',
      'Adding bohemian layers...',
      'Creating vibrant textures...'
    ],
    scandinavian: [
      'Balancing light and function...',
      'Creating Nordic simplicity...',
      'Adding hygge elements...'
    ],
    industrial: [
      'Adding raw textures...',
      'Creating urban atmosphere...',
      'Incorporating industrial elements...'
    ],
    botanical: [
      'Adding natural elements...',
      'Bringing in greenery...',
      'Creating organic harmony...'
    ],
    farmhouse: [
      'Creating rustic charm...',
      'Adding cozy farmhouse details...',
      'Blending traditional elements...'
    ],
    midcentury: [
      'Adding vintage flair...',
      'Creating retro appeal...',
      'Infusing mid-century vibes...'
    ],
  };
  
  const fallbackMessages = [
    'Processing image...',
    'Working the magic...',
    'Almost done...'
  ];
  
  return [
    `${mode === 'empty' ? 'Removing furniture' : 'Decluttering room'}...`,
    ...(styleId ? baseMessages[styleId] : fallbackMessages)
  ];
};

/**
 * Wrapper for uploadRoomImage that includes style parameters
 * This approach preserves the original function while adding style support
 * 
 * @param imageUri Local URI of the image to upload
 * @param mode Processing mode - 'empty' (default) or 'clean'
 * @param designStyle Optional design style to apply
 * @returns A promise that resolves to the job ID
 */
export const uploadRoomImageWithStyle = async (
  imageUri: string,
  mode: ProcessingMode = 'empty',
  designStyle: DesignStyle = null
): Promise<string> => {
  try {
    // If no style specified and mode is not 'styling', use regular upload
    if (!designStyle && mode !== 'styling') {
      return await uploadRoomImage(imageUri, mode);
    }

    // For style processing, we need to handle this differently
    if (mode === 'styling' && designStyle) {
      // This is Stage 2: Apply style to empty room
      // Use the style webhook URL instead of the regular one
      return await uploadImageWithStyleToWebhook(imageUri, designStyle);
    }

    // For Stage 1 (empty room), use regular upload
    return await uploadRoomImage(imageUri, mode);
    
  } catch (error) {
    console.error('Upload with style error:', error);
    throw error;
  }
};

/**
 * Upload image to style webhook for Stage 2 processing
 * @param imageUri The image URI (should be the empty room URL)
 * @param styleId The style to apply
 * @returns Promise that resolves to a job ID
 */
const uploadImageWithStyleToWebhook = async (
  imageUri: string,
  styleId: DesignStyle
): Promise<string> => {
  try {
    console.log('Sending style request to n8n webhook:', { imageUri, styleId });
    
    // Extract job ID from the imageUri (assuming it contains the job ID)
    // The imageUri should be something like: .../rooms/empty/jobId.jpg
    const urlParts = imageUri.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const jobId = fileName.split('.')[0];
    
    const response = await fetch(STYLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: jobId,
        styleId: styleId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Style webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Style webhook response:', result);
    
    // Return the job ID (should be the same as the original job)
    return jobId;
  } catch (error) {
    console.error('Error uploading to style webhook:', error);
    throw error;
  }
};

/**
 * Check if processing should wait for style selection
 * @returns Boolean indicating if processing should pause for style selection
 */
export const shouldWaitForStyleSelection = (): boolean => {
  // Only wait for style selection if the feature is enabled
  if (!isStyleSelectionEnabled()) return false;
  
  // Can be configured based on settings or environment
  return true;
};

/**
 * Check if processing can continue past the style selection stage
 * @param currentProgress The current processing progress (0-1)
 * @param designStyle The currently selected design style (if any)
 * @returns Boolean indicating if processing should continue
 */
export const canContinueProcessing = (
  currentProgress: number,
  designStyle: DesignStyle
): boolean => {
  // If style selection is disabled, always continue
  if (!isStyleSelectionEnabled()) return true;
  
  // If a style is selected, always continue
  if (designStyle) return true;
  
  // If progress is below the waiting threshold, continue
  if (currentProgress < 0.7) return true;
  
  // Otherwise, wait for style selection
  return false;
};

/**
 * Get style-specific processing stages with timing information
 * This helps structure the processing to wait for user input at the right time
 * @param styleId The selected design style
 * @returns Array of processing stages with their relative progress values
 */
export const getProcessingStages = (styleId: DesignStyle) => {
  // Default stages (no style selected)
  const baseStages = [
    { name: 'Preparing', progress: 0.1 },
    { name: 'Uploading', progress: 0.3 },
    { name: 'Processing', progress: 0.5 },
    { name: 'Waiting for style selection', progress: 0.7 },
    // After style selection:
    { name: 'Applying style', progress: 0.8 },
    { name: 'Finalizing', progress: 0.9 },
    { name: 'Complete', progress: 1.0 }
  ];
  
  // If a style is selected, modify the stages to remove waiting
  if (styleId) {
    return baseStages.filter(stage => 
      stage.name !== 'Waiting for style selection'
    );
  }
  
  return baseStages;
};

/**
 * Apply a design style to an already emptied room
 * @param jobId The job ID of the already processed empty room
 * @param styleId The design style to apply
 * @returns Promise that resolves when the style application is initiated
 */
export const applyStyleToRoom = async (
  jobId: string,
  styleId: DesignStyle
): Promise<void> => {
  if (!styleId) {
    throw new Error('Style ID is required');
  }

  try {
    console.log('Applying style to room:', { jobId, styleId });
    
    const response = await fetch(STYLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        styleId,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Style application failed: ${response.status} - ${errorText}`);
    }

    console.log('Style application initiated successfully');
  } catch (error) {
    console.error('Error applying style to room:', error);
    throw error;
  }
}; 