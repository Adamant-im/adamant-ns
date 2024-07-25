import { BaseNotificationInterface } from './baseNotification.js'
import admin from 'firebase-admin'
import App = admin.app.App
import { PushServiceProvider } from '../../types/models.js'

export class FcmNotification implements BaseNotificationInterface {
  private service
  provider = PushServiceProvider.FCM

  constructor(fcmClient: App) {
    this.service = fcmClient
  }

  message(pushToken: string, notification: { title: string; body: string }) {
    this.service.messaging().send({ notification, token: pushToken })
  }

  messageMany(
    pushTokens: string[],
    notification: { title: string; body: string }
  ) {
    this.service.messaging().sendEach(
      pushTokens.map((pushToken) => ({
        notification,
        token: pushToken
      }))
    )
  }
}
