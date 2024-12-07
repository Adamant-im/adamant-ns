import { PushServiceProvider } from '../types/models.js';
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js';
import { FcmNotification } from '../adapters/notification/fcmNotification.js';
import { ApnsNotification } from '../adapters/notification/apnsNotification.js';

export const pushService: Record<
  PushServiceProvider,
  BaseNotificationInterface
> = {
  FCM: new FcmNotification(),
  APNS: new ApnsNotification()
};
