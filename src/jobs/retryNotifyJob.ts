import { schedule } from 'node-cron'
import { config } from '../config/index.js'
import { logger } from '../modules/logger.js'
import { prisma } from '../modules/prisma.js'
import { processTransactionsToNotify } from '../services/processTransactionToNotify.js'

export const spawnRetryNotifyJob = () => {
  let isLocked = false

  logger.info(
    `Spawned retry notify job with ${config.app.retryNotifyInterval} interval`
  )

  return schedule(config.app.retryNotifyInterval, async () => {
    if (isLocked) return

    isLocked = true

    try {
      const transactionsToNotify = await prisma.notifyTransaction.findMany({
        where: {
          isNotified: false,
          lastNotifyDate: { not: null }
        },
        include: {
          device: true
        }
      })

      if (!transactionsToNotify.length) {
        return
      }

      logger.info(
        `Got notifications that failed to send, processing... AdmTxIds: ${transactionsToNotify.map((tx) => tx.admTxId).join(', ')}`
      )

      await processTransactionsToNotify(transactionsToNotify)
    } catch (err) {
      logger.error(err, 'Error while running retry notify job')
    } finally {
      isLocked = false
    }
  })
}
