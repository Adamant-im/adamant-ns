import { transactionsChannel } from './channels/transactionsChannel.js';
import { logger } from '../modules/logger.js';
import { processSignalTransaction } from '../services/processSignalTransaction.js';
import { processTransactionsToNotify } from '../services/processTransactionToNotify.js';
import { prisma } from '../modules/prisma.js';
import { NotifyTransaction, Device } from '@prisma/client';

export const spawnEventHandlers = () => {
  transactionsChannel.on('newSignalMessage', (tx) => {
    processSignalTransaction(tx).catch((e) =>
      logger.error(e, 'Failed to process signal transaction')
    );
  });

  transactionsChannel.on('newMessage', async (tx) => {
    const devices = await prisma.device.findMany({
      where: { admAddress: tx.recipientId }
    });

    if (!devices.length) {
      return;
    }

    logger.info(
      `Got transaction to notify devices, devices ids: ${devices.map((d) => d.id).join(', ')}, providers: ${devices.map((d) => d.pushServiceProvider).join(', ')}, admTxId: ${tx.id}`
    );

    const notifyTransactions: Array<NotifyTransaction & { device: Device }> =
      [];

    await Promise.all(
      devices.map(async (device) => {
        const notifyTransaction = await prisma.notifyTransaction.create({
          data: {
            admTxId: tx.id,
            admTxDate: new Date(tx.timestamp * 1000),
            isNotified: false,
            deviceId: device.id,
            admTx: JSON.stringify(tx)
          }
        });

        notifyTransactions.push({ ...notifyTransaction, device });
      })
    );

    await processTransactionsToNotify(notifyTransactions);
  });
};
