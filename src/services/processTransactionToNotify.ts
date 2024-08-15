import { AnyTransaction } from 'adamant-api'
import { FirebaseError } from 'firebase-admin'
import { createNotificationBody } from './notification/notificationBody.js'
import { logger } from '../modules/logger.js'
import { prisma } from '../modules/prisma.js'
import { pushService } from './pushService.js'
import { Device } from '@prisma/client'

export const processTransactionToNotify = async (
  tx: AnyTransaction,
  device: Device
) => {
  const notification = createNotificationBody(tx)

  let notifyRecord = await prisma.notifyTransaction.findFirst({
    where: {
      admTxId: tx.id,
      deviceId: device.id
    }
  })

  if (!notifyRecord) {
    notifyRecord = await prisma.notifyTransaction.create({
      data: {
        admTxId: tx.id,
        admTxDate: new Date(tx.timestamp * 1000),
        isNotified: false,
        deviceId: device.id,
        admTx: JSON.stringify(tx)
      }
    })
  }

  try {
    await pushService[device.pushServiceProvider].message(
      device.pushToken,
      notification,
      {
        'push-recipient': tx.recipientId,
        'txn-id': tx.id
      }
    )

    await prisma.notifyTransaction.delete({
      where: { id: notifyRecord.id }
    })

    logger.info(
      `Sent notification to device, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${tx.id}`
    )
  } catch (e) {
    if ((e as FirebaseError).code === 'messaging/invalid-recipient') {
      logger.info(
        `Failed to send notification to device (invalid push token), deleting device from DB, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${tx.id}`
      )
      await prisma.notifyTransaction.delete({
        where: { id: notifyRecord.id }
      })
      await prisma.device.delete({
        where: { id: device.id }
      })

      return
    }

    logger.error(
      e,
      `Failed to send notification to device, deviceId: ${device.id}, provider: ${device.pushServiceProvider}, admTxId: ${tx.id}`
    )

    await prisma.notifyTransaction.update({
      where: { id: notifyRecord.id },
      data: {
        lastNotifyDate: new Date()
      }
    })
  }
}
