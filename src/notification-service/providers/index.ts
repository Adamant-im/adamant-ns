import { PushServiceProvider } from '../../types/enums.js';
import { ApnsProvider } from './apns.provider.js';
import { FcmProvider } from './fcm.provider.js';
import { INotificationProvider } from './notification-provider.interface.js';

export const pushProvider: Record<PushServiceProvider, INotificationProvider> =
  {
    FCM: new FcmProvider(),
    APNS: new ApnsProvider()
  };
