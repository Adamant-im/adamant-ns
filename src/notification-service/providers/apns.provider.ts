import { PushServiceProvider } from '../../types/enums.js';
import { INotificationProvider } from './notification-provider.interface.js';

export class ApnsProvider implements INotificationProvider {
  provider = PushServiceProvider.APNS;

  message(): Promise<string> {
    throw new Error('Not implemented');
  }

  messageMany(): Promise<void> {
    throw new Error('Not implemented');
  }
}
