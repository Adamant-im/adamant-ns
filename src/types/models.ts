import { $Enums } from '@prisma/client'

export import PushServiceProvider = $Enums.PushServiceProvider

export interface SignalMessagePayload {
  token: string
  provider: 'apns' | 'fcm'
  action: 'add' | 'remove'
}
