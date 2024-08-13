export enum PushServiceProvider {
  FCM = 'FCM',
  APNS = 'APNS'
}

export interface SignalMessagePayload {
  token: string
  provider: 'apns' | 'fcm'
  action: 'add' | 'remove'
}
