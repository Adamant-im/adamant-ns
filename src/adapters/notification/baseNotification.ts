import { PushServiceProvider } from '../../types/models.js'

export interface BaseNotificationInterface {
  provider: PushServiceProvider | undefined

  message(
    pushToken: string,
    notification: { title: string; body: string },
    data?: { [key: string]: string }
  ): Promise<string>

  messageMany(
    pushTokens: string[],
    notification: { title: string; body: string },
    data?: { [key: string]: string }
  ): void
}
