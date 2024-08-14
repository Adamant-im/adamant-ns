import { AnyTransaction, decodeMessage } from 'adamant-api'
import { processSignalTransaction } from './processSignalTransaction.js'
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js'
import { processTransactionToNotify } from './processTransactionToNotify.js'
import { config } from '../config/index.js'
import { SignalMessagePayload } from '../types/models.js'
import { logger } from '../modules/logger.js'

const processedTxs: { [key: string]: AnyTransaction } = {} // cache for processed transactions

export async function txsParser(tx: AnyTransaction) {
  if (processedTxs[tx.id]) {
    delete processedTxs[tx.id] // removing from cache because we got tx again from rest api or socket
    return
  }

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
  }

  if (isSignalTx) {
    logger.info(
      `Got signal transaction to subscribe to notifications, txId: ${tx.id}, processing...`
    )
    await processSignalTransaction(tx as ChatMessageTransaction)
  } else if (isTxToNotify) {
    logger.info(`Got transaction to notify, txId: ${tx.id}, processing...`)
    await processTransactionToNotify(tx as AnyTransaction)
  }

  processedTxs[tx.id] = tx
}
