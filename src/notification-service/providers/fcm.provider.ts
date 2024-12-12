import admin, { ServiceAccount } from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';
import JSON5 from 'json5';
import fs from 'fs';
import path from 'path';

import { PushServiceProvider } from '../../types/enums.js';
import { config } from '../../config/index.js';
import {
  INotificationProvider,
  NotificationMessage
} from './notification-provider.interface.js';

export const invalidTokenErrorCodes = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  'messaging/invalid-recipient'
];

export class FcmProvider implements INotificationProvider {
  private service;
  provider = PushServiceProvider.FCM;

  constructor() {
    const credentials = JSON5.parse(
      fs.readFileSync(
        path.join(config.projectRoot, 'firebase-credentials.json'),
        'utf8'
      )
    ) as ServiceAccount;

    this.service = admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
  }

  message(notification: NotificationMessage) {
    return this.service.messaging().send(toFirebaseMessage(notification));
  }

  messageMany(notifications: NotificationMessage[]) {
    const messages: Message[] = notifications.map(toFirebaseMessage);

    return this.service.messaging().sendEach(messages);
  }
}

function toFirebaseMessage({ token, title, body, data }: NotificationMessage) {
  return {
    notification: { title, body },
    token,
    data
  };
}

export interface FirebaseError extends Error {
  code: string;
  message: string;
  stack?: string;
}

/** Check if we have a firebase error. */
export function isFirebaseError(err: any): err is FirebaseError {
  return err?.code?.startsWith('auth/');
}
