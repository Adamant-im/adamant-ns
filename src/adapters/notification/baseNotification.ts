import { PushServiceProvider } from '../../types/models.js'

export interface BaseNotificationInterface {
  provider: PushServiceProvider | undefined

  message(
    pushToken: string,
    notification: { title: string; body: string },
    data?: { [key: string]: string }
  ): Promise<string>

  messageMany(
    notifications: {
      token: string
      notification: { title: string; body: string }
      data?: { [key: string]: string }
    }[]
  ): Promise<unknown>
}
