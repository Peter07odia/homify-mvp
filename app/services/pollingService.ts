import { supabase } from '../lib/supabase';
import PhotoStorageService from '../utils/photoStorageService';
import { SUPABASE_URL } from '@env';

export interface JobStatus {
  id: string;
  status: 'processing' | 'done' | 'error';
  original_path: string;
  empty_path?: string;
  styled_path?: string;
  applied_style?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

class PollingService {
  private static instance: PollingService;
  private activePolls: Map<string, NodeJS.Timeout> = new Map();
  private failedJobs: Set<string> = new Set(); // Track failed jobs to prevent re-polling
  private readonly SUPABASE_URL = SUPABASE_URL || '';

  static getInstance(): PollingService {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  // Start polling for a specific job
  startPolling(jobId: string, onUpdate?: (status: JobStatus) => void): void {
    // Don't poll jobs that have already failed multiple times
    if (this.failedJobs.has(jobId)) {
      console.log(`[PollingService] Skipping polling for previously failed job: ${jobId}`);
      return;
    }

    // Clear any existing poll for this job
    this.stopPolling(jobId);

    console.log(`[PollingService] Starting polling for job: ${jobId}`);
    
    let failureCount = 0;
    const maxFailures = 3; // Stop polling after 3 consecutive failures

    const pollInterval = setInterval(async () => {
      try {
        const status = await this.checkJobStatus(jobId);
        
        if (status) {
          console.log(`[PollingService] Job ${jobId} status:`, status);
          
          // Reset failure count on successful response
          failureCount = 0;
          
          // Update local storage with the latest URLs
          await this.updateLocalPhotos(status);
          
          // Call the callback if provided
          if (onUpdate) {
            onUpdate(status);
          }
          
          // Stop polling if job is complete or failed
          if (status.status === 'done' || status.status === 'error') {
            console.log(`[PollingService] Job ${jobId} finished with status: ${status.status}`);
            this.stopPolling(jobId);
            
            // Mark failed jobs to prevent re-polling
            if (status.status === 'error') {
              this.failedJobs.add(jobId);
            }
          }
        } else {
          failureCount++;
          console.warn(`[PollingService] Failed to get status for job ${jobId} (${failureCount}/${maxFailures})`);
          
          // Stop polling after too many failures
          if (failureCount >= maxFailures) {
            console.error(`[PollingService] Too many failures for job ${jobId}, stopping polling`);
            this.stopPolling(jobId);
            this.failedJobs.add(jobId);
          }
        }
      } catch (error) {
        failureCount++;
        console.error(`[PollingService] Error polling job ${jobId} (${failureCount}/${maxFailures}):`, error);
        
        // Stop polling after too many failures
        if (failureCount >= maxFailures) {
          console.error(`[PollingService] Too many failures for job ${jobId}, stopping polling`);
          this.stopPolling(jobId);
          this.failedJobs.add(jobId);
        }
      }
    }, 10000); // Poll every 10 seconds instead of 5 to reduce API calls

    this.activePolls.set(jobId, pollInterval);

    // Auto-stop polling after 5 minutes instead of 10 to reduce costs
    setTimeout(() => {
      this.stopPolling(jobId);
    }, 5 * 60 * 1000);
  }

  // Stop polling for a specific job
  stopPolling(jobId: string): void {
    const pollInterval = this.activePolls.get(jobId);
    if (pollInterval) {
      clearInterval(pollInterval);
      this.activePolls.delete(jobId);
      console.log(`[PollingService] Stopped polling for job: ${jobId}`);
    }
  }

  // Stop all active polling
  stopAllPolling(): void {
    this.activePolls.forEach((interval, jobId) => {
      clearInterval(interval);
      console.log(`[PollingService] Stopped polling for job: ${jobId}`);
    });
    this.activePolls.clear();
  }

  // Check job status in Supabase
  private async checkJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const { data, error } = await supabase
        .from('room_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error(`[PollingService] Error fetching job ${jobId}:`, error);
        return null;
      }

      return data as JobStatus;
    } catch (error) {
      console.error(`[PollingService] Exception checking job status:`, error);
      return null;
    }
  }

  // Update local photo storage with new URLs from Supabase
  private async updateLocalPhotos(jobStatus: JobStatus): Promise<void> {
    try {
      const photos = await PhotoStorageService.loadPhotos();
      
      // Find the photo that matches this job
      // We'll need to match by originalUrl since we might not have the job ID stored locally
      const originalImageUrl = this.getPublicUrlFromPath(jobStatus.original_path);
      const matchingPhoto = photos.find(photo => 
        photo.originalUrl === originalImageUrl ||
        photo.originalUrl.includes(jobStatus.original_path) ||
        photo.id === jobStatus.id
      );

      if (!matchingPhoto) {
        console.log(`[PollingService] No matching local photo found for job ${jobStatus.id}`);
        return;
      }

      // Build updated photo object
      const updatedPhoto = { ...matchingPhoto };
      let hasChanges = false;

      // Update empty room URL if available
      if (jobStatus.empty_path && !updatedPhoto.emptyUrl) {
        updatedPhoto.emptyUrl = this.getPublicUrlFromPath(jobStatus.empty_path);
        hasChanges = true;
        console.log(`[PollingService] Updated empty room URL for photo ${matchingPhoto.id}`);
      }

      // Update styled room URL if available
      if (jobStatus.styled_path && !updatedPhoto.styledUrl) {
        updatedPhoto.styledUrl = this.getPublicUrlFromPath(jobStatus.styled_path);
        updatedPhoto.style = jobStatus.applied_style || updatedPhoto.style;
        hasChanges = true;
        console.log(`[PollingService] Updated styled room URL for photo ${matchingPhoto.id}`);
      }

      // Update status
      updatedPhoto.status = jobStatus.status === 'done' ? 'completed' : 
                           jobStatus.status === 'error' ? 'failed' : 
                           'processing';
      hasChanges = true;
      console.log(`[PollingService] Updated status to ${updatedPhoto.status} for photo ${matchingPhoto.id}`);

      // Save changes if any
      if (hasChanges) {
        await PhotoStorageService.updatePhoto(updatedPhoto);
        console.log(`[PollingService] Successfully updated photo ${matchingPhoto.id}`);
      }

    } catch (error) {
      console.error('[PollingService] Error updating local photos:', error);
    }
  }

  // Convert Supabase storage path to public URL
  private getPublicUrlFromPath(path: string): string {
    if (!path) return '';
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Construct public URL
    return `${this.SUPABASE_URL}/storage/v1/object/public/rooms/${cleanPath}`;
  }

  // Start polling for all processing photos
  async startPollingForProcessingPhotos(): Promise<void> {
    try {
      const photos = await PhotoStorageService.loadPhotos();
      const processingPhotos = photos.filter(photo => photo.status === 'processing');

      console.log(`[PollingService] Found ${processingPhotos.length} processing photos to poll`);
      console.log(`[PollingService] WARNING: This method should only be called manually to prevent auto-triggering workflows`);

      processingPhotos.forEach(photo => {
        // Only poll if we have a valid Supabase job ID
        const jobId = photo.metadata?.jobId;
        
        if (jobId && this.isValidUUID(jobId)) {
          console.log(`[PollingService] Starting polling for job: ${jobId}`);
          this.startPolling(jobId);
        } else {
          console.log(`[PollingService] Skipping photo ${photo.id} - no valid job ID found`);
        }
      });
    } catch (error) {
      console.error('[PollingService] Error starting polling for processing photos:', error);
    }
  }

  // Helper method to validate UUID format
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Get active polling jobs count
  getActivePollingCount(): number {
    return this.activePolls.size;
  }

  // Check if a specific job is being polled
  isPolling(jobId: string): boolean {
    return this.activePolls.has(jobId);
  }

  // Clear failed jobs list (useful for debugging)
  clearFailedJobs(): void {
    this.failedJobs.clear();
    console.log('[PollingService] Cleared failed jobs list');
  }

  // Get count of failed jobs
  getFailedJobsCount(): number {
    return this.failedJobs.size;
  }
}

export default PollingService.getInstance(); 