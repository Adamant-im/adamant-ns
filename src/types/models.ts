export enum JobName {
  TRANSACTIONS = 'TRANSACTIONS'
}

export enum PushServiceProvider {
  FCM = 'FCM',
  APNS = 'APNS'
}

export interface SignalMessagePayload {
  token: string
  provider: 'apns' | 'fcm'
  action: 'add' | 'remove'
}
