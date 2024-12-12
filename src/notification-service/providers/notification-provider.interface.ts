import { PushServiceProvider } from '../../types/enums.js';

export type NotificationMessage = {
  /**
   * Push token targeting specific device
   */
  token: string;
  /**
   * Notification title
   */
  title: string;
  /**
   * Notification content
   */
  body: string;
  /**
   * Notification metadata
   */
  data: Record<string, string>;
};

export interface INotificationProvider {
  provider: PushServiceProvider | undefined;

  message(message: NotificationMessage): Promise<string>;
  messageMany(messages: NotificationMessage[]): Promise<unknown>;
}
