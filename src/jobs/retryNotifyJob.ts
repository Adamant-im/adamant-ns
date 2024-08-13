import { AnyTransaction } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { schedule } from 'node-cron'
import { index } from '../config/index.js'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { createNotificationBody } from '../services/notification/notificationBody.js'
import { Logger } from '../types/index.js'

export const spawnRetryNotifyJob = (
  notificationService: BaseNotificationInterface,
  prisma: PrismaClient,
  logger: Logger
) => {
  let isLocked = false

  logger.info(
    `Spawned retry notify parser job with ${index.app.retryNotifyInterval} interval`
  )

  schedule(index.app.retryNotifyInterval, async () => {
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

        const notification = createNotificationBody(tx)

        logger.info(
          `Got notification than failed to send, deviceId: ${transaction.device.id}, provider: ${transaction.device.pushServiceProvider}, admTxId: ${tx.id}`
        )

        try {
          await notificationService.message(
            transaction.device.pushToken,
            notification,
            {
              'push-recipient': tx.recipientId,
              'txn-id': tx.id
            }
          )

          await prisma.notifyTransaction.delete({
            where: { id: transaction.id }
          })

          logger.info(
            `Successfully sent notification that failed to send, deleting, deviceId: ${transaction.device.id}, provider: ${transaction.device.pushServiceProvider}, admTxId: ${tx.id}`
          )
        } catch (e) {
          logger.error(
            `Failed to send notification again by retry, deviceId: ${transaction.device.id}, provider: ${transaction.device.pushServiceProvider}, admTxId: ${tx.id}`,
            e
          )
          await prisma.notifyTransaction.update({
            where: { id: transaction.id },
            data: {
              lastNotifyDate: new Date()
            }
          })
        }
      })
    )

    isLocked = false
  })
}
