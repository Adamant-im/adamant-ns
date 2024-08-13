import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js'
import { decodeMessage } from 'adamant-api'
import { config } from '../config/index.js'
import { PushServiceProvider, SignalMessagePayload } from '../types/models.js'
import { PrismaClient } from '@prisma/client'
import { Logger } from '../types/index.js'

export const processSignalTransaction = async (
  prisma: PrismaClient,
  tx: ChatMessageTransaction,
  logger: Logger
) => {
  const decryptedMessage = JSON.parse(
    decodeMessage(
      tx.asset?.chat?.message,
      tx.senderPublicKey,
      config.adamantAccount.passPhrase,
      tx.asset?.chat?.own_message
    ).trim()
  ) as SignalMessagePayload

  const payload = {
    pushToken: String(decryptedMessage.token),
    admAddress: tx.senderId,
    pushServiceProvider:
      decryptedMessage.provider.toLowerCase() === 'apns'
        ? PushServiceProvider.APNS
        : PushServiceProvider.FCM
  }

  if (decryptedMessage.action.toLowerCase() === 'add') {
    logger.info(
      `Adding new device to subscribe to notifications, admAddress: ${payload.admAddress}, pushServiceProvider: ${payload.pushServiceProvider}`
    )
    await prisma.device.upsert({
      where: payload,
      update: {},
      create: payload
    })
  } else if (decryptedMessage.action.toLowerCase() === 'remove') {
    logger.info(
      `Removing device from notifications, admAddress: ${payload.admAddress}, pushServiceProvider: ${payload.pushServiceProvider}`
    )
    await prisma.device.delete({
      where: payload
    })
  }
}
