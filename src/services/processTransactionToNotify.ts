import { AnyTransaction, decodeMessage } from 'adamant-api'
import { config } from '../config.js'
import { PrismaClient } from '@prisma/client'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { BigNumber } from 'bignumber.js'

export const processTransactionToNotify = async (
  prisma: PrismaClient,
  notificationService: BaseNotificationInterface,
  tx: AnyTransaction
) => {
  const devices = await prisma.device.findMany({
    where: { admAddress: tx.senderId }
  })

  if (!devices.length) {
    return
  }

  const notification = {
    title: '',
    body: ''
  }

  if (tx.type === 8) {
    const decryptedMessage = decodeMessage(
      tx.asset?.chat?.message,
      tx.senderPublicKey,
      config.adamantAccount.passPhrase,
      tx.asset?.chat?.own_message
    ).trim()

    notification.title = `Message from ${tx.senderId}`
    notification.body =
      decryptedMessage.length > 64
        ? decryptedMessage.substring(0, 64) + '...'
        : decryptedMessage
  } else if (tx.type === 0) {
    const amount = new BigNumber(tx.amount)
      .dividedBy(new BigNumber(1e8))
      .toString()
    const fee = new BigNumber(tx.fee).dividedBy(new BigNumber(1e8)).toString()
    notification.title = `Transfer from ${tx.senderId}`
    notification.body = `Amount: ${amount}, fee: ${fee}`
  }

  const pushTokens = devices
    .filter(
      (device) =>
        device.admAddress === tx.recipientId &&
        device.pushServiceProvider === notificationService.provider
    )
    .map((device) => device.pushToken)

  if (devices.length) {
    notificationService.messageMany(pushTokens, notification)
  }
}
