import PhotoStorageService, { SavedPhoto } from './photoStorageService';
import NotificationService from './notificationService';
import PollingService from '../services/pollingService';
import { EDGE_FUNCTION_URL, SUPABASE_ANON_KEY_REF } from '../lib/supabase';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface ProcessingWorkflow {
  id: string;
  type: 'room_creation' | 'style_application';
  originalImageUri: string;
  roomType?: string;
  selectedStyle?: string;
  targetStyle?: string;
  status: 'started' | 'processing' | 'emptying' | 'completed' | 'error' | 'failed';
  photoId: string;
  supabaseJobId?: string;
  emptyRoomUri?: string;
  styledRoomUri?: string;
}

class WorkflowIntegration {
  private static instance: WorkflowIntegration;
  private activeWorkflows: Map<string, ProcessingWorkflow> = new Map();

  static getInstance(): WorkflowIntegration {
    if (!WorkflowIntegration.instance) {
      WorkflowIntegration.instance = new WorkflowIntegration();
    }
    return WorkflowIntegration.instance;
  }

  // Start room creation workflow (empty room)
  async startRoomCreation(
    originalImageUri: string,
    roomType: string
  ): Promise<string> {
    try {
      const workflowId = generateUUID();
      
      console.log('🏠 [WorkflowIntegration] Starting room creation workflow:', {
        workflowId,
        originalImageUri: originalImageUri.substring(0, 50) + '...',
        roomType
      });
      
      // Save photo to My Photos with processing status first
      const savedPhoto = await PhotoStorageService.createRoomPhoto(originalImageUri, roomType);
      console.log('🏠 [WorkflowIntegration] Photo saved to storage:', savedPhoto.id);
      
      try {
        // Call the Supabase Edge Function to start processing
        console.log('🏠 [WorkflowIntegration] Calling edge function...');
        const response = await this.callEdgeFunction(originalImageUri, 'unified', roomType);
        const supabaseJobId = response.jobId;
        
        console.log('🏠 [WorkflowIntegration] Edge function response:', response);
        
        if (!supabaseJobId) {
          throw new Error('No job ID returned from edge function');
        }
        
        // Update photo with job ID for polling
        await PhotoStorageService.updatePhoto(savedPhoto.id, {
          metadata: {
            ...savedPhoto.metadata,
            jobId: supabaseJobId,
            workflowId: workflowId,
          }
        });
        
        console.log('🏠 [WorkflowIntegration] Updated photo with job ID:', supabaseJobId);
        
        // Create workflow tracking
        const workflow: ProcessingWorkflow = {
          id: workflowId,
          type: 'room_creation',
          originalImageUri,
          roomType,
          status: 'started',
          photoId: savedPhoto.id,
          supabaseJobId: supabaseJobId,
        };
        
        this.activeWorkflows.set(workflowId, workflow);
        
        // Start polling for updates
        PollingService.startPolling(supabaseJobId, (status) => {
          console.log(`🔄 [WorkflowIntegration] Job ${supabaseJobId} update:`, status);
        });
        
        console.log('🏠 Room creation workflow started successfully:', workflowId);
        return workflowId;
        
      } catch (edgeFunctionError) {
        console.error('🏠 [WorkflowIntegration] Edge function failed:', edgeFunctionError);
        
        // Mark the photo as failed since we couldn't start processing
        await PhotoStorageService.updatePhoto(savedPhoto.id, {
          status: 'failed'
        });
        
        // Re-throw the error
        throw edgeFunctionError;
      }
      
    } catch (error) {
      console.error('🏠 [WorkflowIntegration] Error starting room creation workflow:', error);
      throw error;
    }
  }

  // Start style application workflow
  async startStyleApplication(
    emptyRoomUri: string,
    selectedStyle: string,
    originalPhotoId: string
  ): Promise<string> {
    try {
      const workflowId = generateUUID();
      
      console.log('🎨 [WorkflowIntegration] Starting style application workflow:', {
        workflowId,
        emptyRoomUri: emptyRoomUri.substring(0, 50) + '...',
        selectedStyle,
        originalPhotoId
      });
      
      // Call the edge function for style application
      const response = await this.callEdgeFunction(emptyRoomUri, 'style');
      const supabaseJobId = response.jobId;
      
      if (!supabaseJobId) {
        throw new Error('No job ID returned from edge function');
      }
      
      // Create workflow tracking
      const workflow: ProcessingWorkflow = {
        id: workflowId,
        type: 'style_application',
        originalImageUri: emptyRoomUri,
        selectedStyle,
        targetStyle: selectedStyle,
        status: 'started',
        photoId: originalPhotoId,
        supabaseJobId: supabaseJobId,
      };
      
      this.activeWorkflows.set(workflowId, workflow);
      
      console.log('🎨 [WorkflowIntegration] Style application workflow started');
      return workflowId;
      
    } catch (error) {
      console.error('🎨 [WorkflowIntegration] Error starting style application:', error);
      throw error;
    }
  }

  // Add alias method for backward compatibility
  async startUpstyling(
    emptyRoomUri: string,
    selectedStyle: string,
    originalPhotoId: string
  ): Promise<string> {
    return this.startStyleApplication(emptyRoomUri, selectedStyle, originalPhotoId);
  }

  // Call Supabase Edge Function
  private async callEdgeFunction(imageUri: string, mode: 'empty' | 'style' | 'unified', roomType?: string): Promise<any> {
    try {
      console.log('📡 [WorkflowIntegration] Calling edge function with:', { imageUri, mode, roomType });
      
      // Convert local file URI to FormData
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'room_image.jpg',
      } as any);
      formData.append('mode', mode);
      
      // Add unified mode parameters
      if (mode === 'unified') {
        formData.append('roomType', roomType || 'living_room');
        formData.append('selectedStyle', 'modern');
        formData.append('quality', 'standard');
        // Generate and include a UUID for the job
        formData.append('jobId', generateUUID());
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY_REF}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📡 [WorkflowIntegration] Edge function result:', result);
      
      return result;
    } catch (error) {
      console.error('📡 [WorkflowIntegration] Edge function error:', error);
      throw error;
    }
  }

  // Update workflow when room emptying completes
  async completeRoomEmptying(
    workflowId: string,
    emptyRoomImageUri: string
  ): Promise<void> {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow || !workflow.photoId) {
        console.warn('Workflow not found or missing photo ID:', workflowId);
        return;
      }

      // Update photo with empty room image
      await PhotoStorageService.completeRoomEmptying(workflow.photoId, emptyRoomImageUri);
      
      // Update workflow status
      workflow.status = 'emptying';
      this.activeWorkflows.set(workflowId, workflow);
      
      console.log('🏠 Room emptying completed for workflow:', workflowId);
    } catch (error) {
      console.error('Error completing room emptying:', error);
      throw error;
    }
  }

  // Update workflow when upstyling completes
  async completeUpstyling(
    workflowId: string,
    styledImageUri: string
  ): Promise<void> {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow || !workflow.photoId || !workflow.targetStyle) {
        console.warn('Workflow not found or missing required data:', workflowId);
        return;
      }

      // Update photo with styled image
      await PhotoStorageService.completeUpstyling(
        workflow.photoId, 
        styledImageUri, 
        workflow.targetStyle
      );
      
      // Update workflow status
      workflow.status = 'completed';
      this.activeWorkflows.set(workflowId, workflow);
      
      // Show completion notification
      await NotificationService.showProcessingCompleteNotification(workflow.targetStyle);
      
      console.log('🎨 Upstyling completed for workflow:', workflowId);
    } catch (error) {
      console.error('Error completing upstyling:', error);
      throw error;
    }
  }

  // Mark workflow as failed
  async markWorkflowFailed(workflowId: string, error?: string): Promise<void> {
    try {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow || !workflow.photoId) {
        console.warn('Workflow not found or missing photo ID:', workflowId);
        return;
      }

      // Mark photo as failed
      await PhotoStorageService.markPhotoAsFailed(workflow.photoId);
      
      // Update workflow status
      workflow.status = 'failed';
      this.activeWorkflows.set(workflowId, workflow);
      
      console.log('❌ Workflow failed:', workflowId, error);
    } catch (error) {
      console.error('Error marking workflow as failed:', error);
    }
  }

  // Get active workflow by ID
  getWorkflow(workflowId: string): ProcessingWorkflow | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  // Get all active workflows
  getActiveWorkflows(): ProcessingWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  // Clear completed workflows
  clearCompletedWorkflows(): void {
    this.activeWorkflows.forEach((workflow, id) => {
      if (workflow.status === 'completed' || workflow.status === 'failed') {
        this.activeWorkflows.delete(id);
      }
    });
  }

  // Initialize polling for any existing processing photos on app start
  async initializePolling(): Promise<void> {
    try {
      console.log('🔄 [WorkflowIntegration] Initializing polling for existing processing photos');
      
      // Clean up old processing photos that don't have job IDs
      await this.cleanupOrphanedProcessingPhotos();
      
      console.log('🔄 [WorkflowIntegration] Polling initialization completed (auto-polling disabled)');
    } catch (error) {
      console.error('Error initializing polling:', error);
    }
  }

  // Clean up processing photos that don't have valid job IDs
  private async cleanupOrphanedProcessingPhotos(): Promise<void> {
    try {
      const photos = await PhotoStorageService.loadPhotos();
      const orphanedPhotos = photos.filter(photo => 
        photo.status === 'processing' && 
        (!photo.metadata?.jobId || !this.isValidUUID(photo.metadata.jobId))
      );

      console.log(`🧹 [WorkflowIntegration] Found ${orphanedPhotos.length} orphaned processing photos`);

      for (const photo of orphanedPhotos) {
        console.log(`🧹 [WorkflowIntegration] Marking orphaned photo as failed: ${photo.id}`);
        await PhotoStorageService.updatePhoto(photo.id, {
          status: 'failed'
        });
      }
    } catch (error) {
      console.error('🧹 [WorkflowIntegration] Error cleaning up orphaned photos:', error);
    }
  }

  // Helper method to validate UUID format
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}

export default WorkflowIntegration.getInstance(); 