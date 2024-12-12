import { queue } from './notifications.queue.js';
import { NotificationPayload } from '../types/db.js';
import { PushServiceProvider } from '../types/enums.js';

export class NotificationService {
  async send(notifications: NotificationPayload | NotificationPayload[]) {
    return Array.isArray(notifications)
      ? this.sendMany(notifications)
      : this.sendSingle(notifications);
  }

  private async sendSingle(notification: NotificationPayload) {
    const { pushServiceProvider } = notification.device;

    queue[pushServiceProvider as PushServiceProvider].push(notification);
  }

  private async sendMany(notifications: NotificationPayload[]) {
    const groupedNotifications = this.groupNotifications(notifications);

    for (const [provider, notificationsList] of Object.entries(
      groupedNotifications
    )) {
      queue[provider as PushServiceProvider].push(notificationsList);
    }
  }

  /**
   * Group notifications by Push provider
   * @param notifications
   */
  private groupNotifications(notifications: NotificationPayload[]) {
    const groupedNotifications: Record<
      PushServiceProvider,
      NotificationPayload[]
    > = {
      FCM: [],
      APNS: []
    };

    for (const notification of notifications) {
      groupedNotifications[notification.device.pushServiceProvider].push(
        notification
      );
    }

    return groupedNotifications;
  }
}

export const notificationService = new NotificationService();
