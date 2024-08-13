import { AnyTransaction } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { schedule } from 'node-cron'
import { config } from '../config.js'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { createNotificationBody } from '../services/notification/notificationBody.js'

export const spawnRetryNotifyJob = (
  notificationService: BaseNotificationInterface,
  prisma: PrismaClient
) => {
  let isLocked = false

  schedule(config.app.retryNotifyInterval, async () => {
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
        } catch (e) {
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
