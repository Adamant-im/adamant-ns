import { AnyTransaction } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { FirebaseError } from 'firebase-admin'
import { createNotificationBody } from './notification/notificationBody.js'

export const processTransactionToNotify = async (
  prisma: PrismaClient,
  notificationService: BaseNotificationInterface,
  tx: AnyTransaction
) => {
  let devices = await prisma.device.findMany({
    where: { admAddress: tx.recipientId }
  })

  if (!devices.length) {
    return
  }

  const notification = createNotificationBody(tx)

  devices = devices.filter(
    (device) =>
      device.admAddress === tx.recipientId &&
      device.pushServiceProvider === notificationService.provider
  )

  if (devices.length) {
    await Promise.all(
      devices.map(async (device) => {
        const notifyRecord = await prisma.notifyTransaction.create({
          data: {
            admTxId: tx.id,
            admTxDate: new Date(tx.timestamp * 1000),
            isNotified: false,
            deviceId: device.id,
            admTx: JSON.stringify(tx)
          }
        })

        try {
          await notificationService.message(device.pushToken, notification, {
            'push-recipient': tx.recipientId,
            'txn-id': tx.id
          })

          await prisma.notifyTransaction.delete({
            where: { id: notifyRecord.id }
          })
        } catch (e) {
          if ((e as FirebaseError).code === 'messaging/invalid-recipient') {
            await prisma.notifyTransaction.delete({
              where: { id: notifyRecord.id }
            })
            await prisma.device.delete({
              where: { id: device.id }
            })

            return
          }

          await prisma.notifyTransaction.update({
            where: { id: notifyRecord.id },
            data: {
              lastNotifyDate: new Date()
            }
          })
        }
      })
    )
  }
}
