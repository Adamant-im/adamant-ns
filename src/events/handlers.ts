import {
  notifyMessagesChannel,
  signalMessagesChannel,
  transactionsChannel
} from './channels.js'
import { txsParser } from '../services/txsParser.js'
import { AnyTransaction } from 'adamant-api'
import { logger } from '../modules/logger.js'
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js'
import { processSignalTransaction } from '../services/processSignalTransaction.js'
import { processTransactionToNotify } from '../services/processTransactionToNotify.js'
import { prisma } from '../modules/prisma.js'

export const spawnEventHandlers = () => {
  const processedTxs: { [key: string]: AnyTransaction } = {} // cache for processed transactions

  transactionsChannel.on('newTransaction', (tx: AnyTransaction) => {
    if (processedTxs[tx.id]) {
      delete processedTxs[tx.id] // removing from cache because we got tx again from rest api or socket
      return
    }

    processedTxs[tx.id] = tx

    txsParser(tx).catch((e) => logger.error(e, 'Failed to parsed transaction'))
  })

  signalMessagesChannel.on('newSignalMessage', (tx: ChatMessageTransaction) => {
    processSignalTransaction(tx).catch((e) =>
      logger.error(e, 'Failed to process signal transaction')
    )
  })

  notifyMessagesChannel.on('newMessage', async (tx: AnyTransaction) => {
    let devices = await prisma.device.findMany({
      where: { admAddress: tx.recipientId }
    })

    devices = devices.filter((device) => device.admAddress === tx.recipientId)

    if (!devices.length) {
      return
    }

    logger.info(
      `Got transaction to notify devices, devices ids: ${devices.map((d) => d.id).join(', ')}, providers: ${devices.map((d) => d.pushServiceProvider).join(', ')}, admTxId: ${tx.id}`
    )

    await Promise.all(
      devices.map((device) => {
        processTransactionToNotify(tx, device)
      })
    )
  })
}
