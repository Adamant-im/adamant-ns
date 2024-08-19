import { transactionsChannel } from './channels/transactionsChannel.js'
import { logger } from '../modules/logger.js'
import { processSignalTransaction } from '../services/processSignalTransaction.js'
import { processTransactionToNotify } from '../services/processTransactionToNotify.js'
import { prisma } from '../modules/prisma.js'

export const spawnEventHandlers = () => {
  transactionsChannel.on('newSignalMessage', (tx) => {
    processSignalTransaction(tx).catch((e) =>
      logger.error(e, 'Failed to process signal transaction')
    )
  })

  transactionsChannel.on('newMessage', async (tx) => {
    const devices = await prisma.device.findMany({
      where: { admAddress: tx.recipientId }
    })

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
