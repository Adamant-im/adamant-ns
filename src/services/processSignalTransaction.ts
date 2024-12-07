import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js';
import { decodeMessage } from 'adamant-api';
import { config } from '../config/index.js';
import { TSignalMessagePayload } from '../types/models.js';
import { prisma } from '../modules/prisma.js';
import { logger } from '../modules/logger.js';

export const processSignalTransaction = async (tx: ChatMessageTransaction) => {
  const decryptedMessage = JSON.parse(
    decodeMessage(
      tx.asset?.chat?.message,
      tx.senderPublicKey,
      config.adamantAccount.passPhrase,
      tx.asset?.chat?.own_message
    ).trim()
  ) as TSignalMessagePayload;

  const payload = {
    pushToken: String(decryptedMessage.token),
    admAddress: tx.senderId,
    pushServiceProvider: decryptedMessage.provider
  };

  if (decryptedMessage.action.toLowerCase() === 'add') {
    logger.info(
      `Adding new device to subscribe to notifications, admAddress: ${payload.admAddress}, pushServiceProvider: ${payload.pushServiceProvider}`
    );
    await prisma.device.upsert({
      where: payload,
      update: {},
      create: payload
    });
  } else if (decryptedMessage.action.toLowerCase() === 'remove') {
    logger.info(
      `Removing device from notifications, admAddress: ${payload.admAddress}, pushServiceProvider: ${payload.pushServiceProvider}`
    );

    try {
      await prisma.device.delete({
        where: payload
      });

      logger.info(
        `Removed device for ${payload.admAddress} address of ${payload.pushServiceProvider} provider`
      );
    } catch (err) {
      logger.warn(
        err,
        `Failed to remove device for ${payload.admAddress} address of ${payload.pushServiceProvider} provider`
      );
    }
  }
};
