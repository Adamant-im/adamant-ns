import { TransactionsChannel } from './adamant/channels/transactions.channel.js';
import {
  MessageTransaction,
  SignalTransaction,
  TokenTransaction
} from './adamant/types.js';
import { logger } from './modules/logger.js';
import { prisma } from './modules/prisma.js';
import { server } from './server.js';
import { NotificationStatus } from './types/enums.js';
import { decodeAssetMessage } from './utils/adm.js';
import { notificationService } from './notification-service/notification.service.js';
import { queue } from './notification-service/notifications.queue.js';

export class App {
  transactionsChannel: TransactionsChannel;

  constructor() {
    this.transactionsChannel = new TransactionsChannel();
  }

  async init() {
    // Subscribe to the Transactions channel and watch for new messages.
    this.transactionsChannel.on('newSignalMessage', this.onSignalTransaction);
    this.transactionsChannel.on('newMessage', this.onMessage);
    await this.transactionsChannel.init();
  }

  private onSignalTransaction = async (tx: SignalTransaction) => {
    const message = decodeAssetMessage(tx);

    if (!message) {
      logger.warn(
        tx,
        `Cannot decode the transaction with ID ${tx.id}, or it has an invalid asset message.`
      );
      return;
    }

    const { deviceId, token, provider, action } = message;

    if (action === 'add') {
      logger.info(
        `Subscribe ${tx.senderId} with device ${deviceId} to ${message.provider} notification provider`
      );
      await prisma.device.upsert({
        where: { id: deviceId },
        update: {
          pushToken: token,
          pushServiceProvider: provider,
          admAddress: tx.senderId
        },
        create: {
          id: deviceId,
          pushToken: token,
          pushServiceProvider: provider,
          admAddress: tx.senderId
        }
      });
    } else if (action === 'remove') {
      logger.info(
        `Unsubscribe ${tx.senderId} with device ${deviceId} from ${message.provider} notifications`
      );

      try {
        await prisma.device.delete({
          where: { id: deviceId }
        });

        logger.info(
          `Removed device ${deviceId} of ${tx.senderId} with ${provider} provider`
        );
      } catch (err) {
        logger.warn(
          err,
          `Failed to remove device ${deviceId} of ${tx.senderId} with ${provider} provider`
        );
      }
    }
  };

  private onMessage = async (tx: TokenTransaction | MessageTransaction) => {
    const devices = await prisma.device.findMany({
      where: { admAddress: tx.recipientId }
    });

    if (!devices.length) {
      // No device is subscribed to receive notifications for that address.
      return;
    }

    await prisma.notifications.createMany({
      data: devices.map((device) => ({
        admTxId: tx.id,
        admTxDate: new Date(tx.timestamp * 1000),
        admTxType: tx.type,
        admTx: tx,
        deviceId: device.id
      })),
      skipDuplicates: true
    });

    logger.debug(
      `Notification created, devices ids: ${devices.map((d) => d.id).join(', ')}, providers: ${devices.map((d) => d.pushServiceProvider).join(', ')}, admTxId: ${tx.id}`
    );

    const pendingNotifications = await prisma.notifications.findMany({
      where: { admTxId: tx.id, status: NotificationStatus.Pending },
      include: { device: true }
    });

    await notificationService.send(pendingNotifications);
  };

  async destroy() {
    // First stop receiving new transactions
    this.transactionsChannel.off('newSignalMessage', this.onSignalTransaction);
    this.transactionsChannel.off('newMessage', this.onMessage);
    try {
      this.transactionsChannel.destroy();
      logger.info('Stopped transactions channel running tasks');
    } catch (error) {
      logger.error(error, 'Failed to stop transactions channel running tasks');
    }

    // Close server
    try {
      await server.close();
      logger.info('Stopped fastify server');
    } catch (error) {
      logger.error(error, 'Failed to stop fastify server');
      process.exit(1);
    }

    // Process pending transactions from queue
    logger.info('Drying queues');
    await queue.FCM.drain();
    await queue.APNS.drain();

    // Close Prisma connection
    try {
      await prisma.$disconnect();
      logger.info('Stopped prisma connection');
    } catch (error) {
      logger.error(error, 'Failed to stop prisma connection');
      process.exit(1);
    }

    process.exit(0);
  }
}
