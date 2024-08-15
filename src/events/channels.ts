import EventEmitter from 'events'
import { AnyTransaction } from 'adamant-api'
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js'

interface TransactionsEvents {
  newTransaction: (tx: AnyTransaction) => void
}
interface SignalMessagesEvents {
  newSignalMessage: (tx: ChatMessageTransaction) => void
}
interface NotifyMessagesEvents {
  newMessage: (tx: AnyTransaction) => void
}

export const transactionsChannel = new EventEmitter() as EventEmitter & {
  on<K extends keyof TransactionsEvents>(
    event: K,
    listener: TransactionsEvents[K]
  ): void
  emit<K extends keyof TransactionsEvents>(
    event: K,
    ...args: Parameters<TransactionsEvents[K]>
  ): boolean
}
export const signalMessagesChannel = new EventEmitter() as EventEmitter & {
  on<K extends keyof SignalMessagesEvents>(
    event: K,
    listener: SignalMessagesEvents[K]
  ): void
  emit<K extends keyof SignalMessagesEvents>(
    event: K,
    ...args: Parameters<SignalMessagesEvents[K]>
  ): boolean
}
export const notifyMessagesChannel = new EventEmitter() as EventEmitter & {
  on<K extends keyof NotifyMessagesEvents>(
    event: K,
    listener: NotifyMessagesEvents[K]
  ): void
  emit<K extends keyof NotifyMessagesEvents>(
    event: K,
    ...args: Parameters<NotifyMessagesEvents[K]>
  ): boolean
}
