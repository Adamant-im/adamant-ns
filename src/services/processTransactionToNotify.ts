import { AnyTransaction } from 'adamant-api'
import { messaging } from 'firebase-admin'
import { createNotificationBody } from './notification/notificationBody.js'
import { logger } from '../modules/logger.js'
import { prisma } from '../modules/prisma.js'
import { pushService } from './pushService.js'
import { NotifyTransaction, Device } from '@prisma/client'
import { PushServiceProvider } from '../types/models.js'
import { invalidTokenErrorCodes } from '../adapters/notification/fcmNotification.js'

export const processTransactionsToNotify = async (
  txs: Array<NotifyTransaction & { device: Device }>
) => {
  const fcmNotifications = txs.filter(
    (tx) => tx.device.pushServiceProvider === PushServiceProvider.FCM
  )

  if (fcmNotifications.length) {
    const notifications = fcmNotifications.map((notification) => {
      const tx = JSON.parse(notification.admTx as string) as AnyTransaction

      return {
        notification: createNotificationBody(tx as AnyTransaction),
        token: notification.device.pushToken,
        data: {
          'push-recipient': tx.recipientId,
          'txn-id': tx.id
        }
      }
    })

    try {
      const data = (await pushService.FCM.messageMany(
        notifications
      )) as messaging.BatchResponse

      for (const [index, response] of data.responses.entries()) {
        const notifyTransaction = txs.find(
          (tx) => tx.device.pushToken === notifications[index]?.token
        )
        const device = notifyTransaction?.device

        if (!notifyTransaction || !device) {
          return
        }

        if (response.success) {
          await prisma.notifyTransaction.delete({
            where: { id: notifyTransaction.id }
          })

          logger.info(
            `Sent notification to device, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${notifyTransaction.admTxId}`
          )
          return
        }

        if (response.error?.code) {
          if (invalidTokenErrorCodes.includes(response.error?.code)) {
            logger.info(
              `Failed to send notification to device (invalid push token), deleting device from DB, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${notifyTransaction.admTxId}`
            )
            await prisma.notifyTransaction.delete({
              where: { id: notifyTransaction.id }
            })
            await prisma.device.delete({
              where: { id: device.id }
            })

            return
          } else {
            logger.error(
              response.error.code,
              `Failed to send notification to device, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${notifyTransaction.admTxId}`
            )

            await prisma.notifyTransaction.update({
              where: { id: notifyTransaction.id },
              data: {
                lastNotifyDate: new Date()
              }
            })
          }
        }
      }
    } catch (err) {
      logger.error(
        err,
        `Failed to push notifications through ${PushServiceProvider.FCM} provider`
      )

      await Promise.all(
        txs.map((tx) =>
          prisma.notifyTransaction.update({
            where: { id: tx.id },
            data: {
              lastNotifyDate: new Date()
            }
          })
        )
      )
    }
  }
}
