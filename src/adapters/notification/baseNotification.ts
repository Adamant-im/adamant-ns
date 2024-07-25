import { PushServiceProvider } from '../../types/models.js'

export interface BaseNotificationInterface {
  provider: PushServiceProvider | undefined

  message(
    pushToken: string,
    notification: { title: string; body: string }
  ): void

  messageMany(
    pushTokens: string[],
    notification: { title: string; body: string }
  ): void
}

export class BaseNotification implements BaseNotificationInterface {
  provider: PushServiceProvider | undefined

  message(): void {
    throw new Error('Not implemented')
  }

  messageMany(): void {
    throw new Error('Not implemented')
  }
}
