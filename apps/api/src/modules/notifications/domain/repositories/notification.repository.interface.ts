import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

export interface CreateNotificationInput {
  associationId: string;
  userId: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title: string;
  message: string;
  linkUrl?: string;
}

export interface INotificationRepository {
  createNotification(input: CreateNotificationInput): Promise<any>;
  getNotificationsForUser(userId: string, associationId?: string): Promise<{
    unreadCount: number;
    notifications: any[];
  }>;
  markAsRead(notificationId: string, userId: string): Promise<any>;
  markAllAsRead(userId: string, associationId?: string): Promise<any>;

  // Automated Relances / Multi-channel Reminders
  triggerAutomatedReminders(associationId: string): Promise<{
    tontineRemindersCount: number;
    loanRemindersCount: number;
    meetingRemindersCount: number;
  }>;
}
