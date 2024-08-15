import { AnyTransaction } from 'adamant-api'
import { schedule } from 'node-cron'
import { config } from '../config/index.js'
import { logger } from '../modules/logger.js'
import { prisma } from '../modules/prisma.js'
import { processTransactionToNotify } from '../services/processTransactionToNotify.js'

export const spawnRetryNotifyJob = () => {
  let isLocked = false

  logger.info(
    `Spawned retry notify job with ${config.app.retryNotifyInterval} interval`
  )

  return schedule(config.app.retryNotifyInterval, async () => {
    if (isLocked) return

    isLocked = true

    const transactionsToNotify = await prisma.notifyTransaction.findMany({
      where: {
        isNotified: false,
        lastNotifyDate: { not: null }
      },
      include: {
        device: true
      }
    })

    await Promise.all(
      transactionsToNotify.map(async (transaction) => {
        const tx = JSON.parse(transaction.admTx as string) as AnyTransaction

        logger.info(
          `Got notification that failed to send, processing... DeviceId: ${transaction.device.id}, provider: ${transaction.device.pushServiceProvider}, admTxId: ${tx.id}`
        )

        processTransactionToNotify(tx, transaction.device).catch((e) =>
          logger.error(e, 'Failed to process failed transaction to notify')
        )
      })
    )

    isLocked = false
  })
}
