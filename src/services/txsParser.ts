import { AnyTransaction, decodeMessage } from 'adamant-api'
import { config } from '../config/index.js'
import { SignalMessagePayload } from '../types/models.js'
import { logger } from '../modules/logger.js'
import {
  notifyMessagesChannel,
  signalMessagesChannel
} from '../events/channels.js'
import { adamantClient } from '../modules/adamantClient.js'

export async function txsParser(tx: AnyTransaction) {
  let isSignalTx = false,
    isTxToNotify = false

  if (
    tx.recipientId === config.adamantAccount.address &&
    tx.type === 8 &&
    tx.asset?.chat?.type === 3
  ) {
    const decryptedMessage = JSON.parse(
      decodeMessage(
        tx.asset?.chat?.message,
        tx.senderPublicKey,
        config.adamantAccount.passPhrase,
        tx.asset?.chat?.own_message
      ).trim()
    ) as SignalMessagePayload
    if (
      decryptedMessage['token'] &&
      decryptedMessage['provider'] &&
      decryptedMessage['action']
    ) {
      isSignalTx = true
    } else {
      return
    }
  } else if (config.notify.notifyTxTypes.includes(tx.type)) {
    if (
      !(
        tx.type === 8 &&
        config.notify.chatTxTypeIncludeSubtype.includes(tx.asset?.chat?.type)
      )
    ) {
      return
    }

    isTxToNotify = true
  } else {
    return
  }

  const getHeightResponse = await adamantClient.getHeight()
  const currentHeight = getHeightResponse.success ? getHeightResponse.height : 0

  if (tx.height < currentHeight - config.notify.latestHeightToNotify) {
    // skip if transaction is too old
    return
  }

  if (isSignalTx) {
    logger.info(
      `Got signal transaction to (un)subscribe to notifications, txId: ${tx.id}, processing...`
    )

    signalMessagesChannel.emit('newSignalMessage', tx)
  } else if (isTxToNotify) {
    logger.info(`Got transaction to notify, txId: ${tx.id}, processing...`)
    notifyMessagesChannel.emit('newMessage', tx)
  }
}
