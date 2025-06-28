import * as Haptics from 'expo-haptics';
import { Platform, Alert } from 'react-native';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'download_complete' | 'processing_complete' | 'general';
  timestamp: number;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationQueue: NotificationData[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // For Expo Go, we'll use basic alert permissions
      if (Platform.OS === 'ios') {
        // iOS requests permission automatically when showing alerts
        console.log('📱 iOS: Using system alerts for notifications');
        return true;
      } else {
        // Android can use system notifications in Expo Go
        console.log('📱 Android: Using system alerts for notifications');
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async showDownloadCompleteNotification(imageType: 'empty' | 'styled' = 'styled'): Promise<void> {
    try {
      const notification: NotificationData = {
        id: `download_${Date.now()}`,
        title: '✅ Download Complete!',
        body: `Your ${imageType} room image has been saved to your photo library`,
        type: 'download_complete',
        timestamp: Date.now(),
        data: {
          imageType,
        },
      };

      // Add haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to queue for tracking
      this.notificationQueue.push(notification);

      // Show alert in development (replace with actual notification in production)
      if (__DEV__) {
        console.log('📱 Download notification:', notification.title, notification.body);
      }

      console.log('Download complete notification queued:', notification);
    } catch (error) {
      console.error('Error showing download notification:', error);
    }
  }

  async showProcessingCompleteNotification(style: string): Promise<void> {
    try {
      const notification: NotificationData = {
        id: `processing_${Date.now()}`,
        title: '🎨 Room Styling Complete!',
        body: `Your ${style} styled room is ready to view`,
        type: 'processing_complete',
        timestamp: Date.now(),
        data: {
          style,
        },
      };

      // Add haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to queue for tracking
      this.notificationQueue.push(notification);

      // Show system alert for completion (works in Expo Go)
      Alert.alert(
        notification.title,
        notification.body,
        [
          {
            text: 'View Result',
            style: 'default',
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );

      console.log('Processing complete notification shown:', notification);
    } catch (error) {
      console.error('Error showing processing notification:', error);
    }
  }

  async showGeneralNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      const notification: NotificationData = {
        id: `general_${Date.now()}`,
        title,
        body,
        type: 'general',
        timestamp: Date.now(),
        data: {
          ...data,
        },
      };

      // Add haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add to queue for tracking
      this.notificationQueue.push(notification);

      // Show alert in development (replace with actual notification in production)
      if (__DEV__) {
        console.log('📱 General notification:', notification.title, notification.body);
      }

      console.log('General notification queued:', notification);
    } catch (error) {
      console.error('Error showing general notification:', error);
    }
  }

  getRecentNotifications(limit: number = 10): NotificationData[] {
    return this.notificationQueue
      .slice(-limit)
      .reverse(); // Most recent first
  }

  clearNotifications(): void {
    this.notificationQueue = [];
    console.log('📱 All notifications cleared');
  }

  getNotificationCount(): number {
    return this.notificationQueue.length;
  }

  hasUnreadNotifications(): boolean {
    return this.notificationQueue.length > 0;
  }

  // Add some demo notifications for testing
  addDemoNotifications(): void {
    const demoNotifications: NotificationData[] = [
      {
        id: 'demo_1',
        title: '🎨 Room Styling Complete!',
        body: 'Your Modern styled living room is ready to view',
        type: 'processing_complete',
        timestamp: Date.now() - 3600000, // 1 hour ago
        data: { style: 'Modern' },
      },
      {
        id: 'demo_2',
        title: '✅ Download Complete!',
        body: 'Your styled room image has been saved to your photo library',
        type: 'download_complete',
        timestamp: Date.now() - 7200000, // 2 hours ago
        data: { imageType: 'styled' },
      },
    ];

    this.notificationQueue.push(...demoNotifications);
    console.log('📱 Demo notifications added');
  }
}

export default NotificationService.getInstance(); 