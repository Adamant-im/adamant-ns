import { BaseNotificationInterface } from './baseNotification.js'
import { PushServiceProvider } from '../../types/models.js'

export class ApnsNotification implements BaseNotificationInterface {
  provider = PushServiceProvider.APNS

  message(): Promise<string> {
    throw new Error('Not implemented')
  }

  messageMany(): Promise<void> {
    throw new Error('Not implemented')
  }
}
