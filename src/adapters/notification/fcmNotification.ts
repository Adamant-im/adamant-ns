import { BaseNotificationInterface } from './baseNotification.js'
import admin, { ServiceAccount } from 'firebase-admin'
import { PushServiceProvider } from '../../types/models.js'
import JSON5 from 'json5'
import fs from 'fs'
import path from 'path'
import { config } from '../../config/index.js'

export const invalidTokenErrorCodes = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  'messaging/invalid-recipient'
]

export class FcmNotification implements BaseNotificationInterface {
  private service
  provider = PushServiceProvider.FCM

  constructor() {
    const credentials = JSON5.parse(
      fs.readFileSync(
        path.join(config.app.projectRoot, 'firebase-credentials.json'),
        'utf8'
      )
    ) as ServiceAccount

    this.service = admin.initializeApp({
      credential: admin.credential.cert(credentials)
    })
  }

  message(
    pushToken: string,
    notification: { title: string; body: string },
    data?: { [key: string]: string }
  ) {
    return this.service
      .messaging()
      .send({ notification, token: pushToken, ...(data ? { data } : {}) })
  }

  messageMany(
    notifications: {
      token: string
      notification: { title: string; body: string }
      data?: { [key: string]: string }
    }[]
  ) {
    return this.service.messaging().sendEach(notifications)
  }
}
