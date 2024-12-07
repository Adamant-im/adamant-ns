import EventEmitter from 'events';
import { AnyTransaction } from 'adamant-api';
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js';
import { schedule, ScheduledTask } from 'node-cron';
import { JobName } from '@prisma/client';

import { logger } from '../../modules/logger.js';
import { config } from '../../config/index.js';
import { adamantClient } from '../../modules/adamantClient.js';
import { prisma } from '../../modules/prisma.js';
import { isSignalTx } from '../../services/parser/isSignalTx.js';
import { isTxToNotify } from '../../services/parser/isTxToNotify.js';

class TransactionsChannel extends EventEmitter {
  private isLocked: boolean;
  private job?: ScheduledTask;
  private processedTxs: { [key: string]: AnyTransaction } = {}; // cache for processed transactions

  constructor() {
    super();
    this.isLocked = false;
  }

  init() {
    if (adamantClient.socket) {
      adamantClient.socket.on(this.handleTransaction);
      adamantClient.socket.catch((error) => logger.error(error));
    } else {
      logger.warn(
        '[TransactionsChannel] ADAMANT sockets are not enabled. Using REST as a fallback.'
      );
    }

    this.startJob();
  }

  private handleTransaction = (tx: AnyTransaction) => {
    if (this.processedTxs[tx.id]) {
      delete this.processedTxs[tx.id]; // removing from cache because we got tx again from rest api or socket
      return;
    }

    this.processedTxs[tx.id] = tx;

    if (isSignalTx(tx)) {
      logger.info(
        `Got signal transaction to (un)subscribe to notifications, txId: ${tx.id}, processing...`
      );
      this.emit('newSignalMessage', tx as ChatMessageTransaction);
    } else if (isTxToNotify(tx)) {
      this.emit('newMessage', tx);
    }
  };

  private startJob() {
    logger.info(
      `Spawned transaction parser job with ${config.txCheckInterval} interval`
    );
    this.job = schedule(config.txCheckInterval, async () => {
      if (this.isLocked) return;

      this.isLocked = true;

      try {
        const getHeightResponse = await adamantClient.getHeight();
        const currentHeight = getHeightResponse.success
          ? getHeightResponse.height
          : 0;

        let jobStatus = await prisma.cronJobStatus.findFirst({
          where: { jobName: JobName.TRANSACTIONS }
        });

        if (!jobStatus) {
          jobStatus = await prisma.cronJobStatus.create({
            data: {
              jobName: JobName.TRANSACTIONS,
              state: JSON.stringify({
                lastHeight: currentHeight
              })
            }
          });
        }

        const lastCheckHeight = (
          JSON.parse(jobStatus.state as string) as { lastHeight: number }
        ).lastHeight;

        // Determine fetch interval
        let heightToFetch = lastCheckHeight + config.heightSkipPerHeight;

        if (heightToFetch > currentHeight) {
          this.isLocked = false;
          return;
        }

        if (currentHeight - heightToFetch > 1) {
          // If the gap is more than 1 block, fetch transactions in chunks of 1000 blocks
          heightToFetch = lastCheckHeight + 1000;

          if (currentHeight - heightToFetch < 0) {
            // if the gap reaches currenHeight and more, than set it to currentHeight
            heightToFetch = currentHeight;
          }
        }

        const txs = await adamantClient.getTransactions({
          fromHeight: lastCheckHeight + 1,
          and: {
            toHeight: heightToFetch
          },
          returnAsset: 1
        });

        if (!txs.success) {
          this.isLocked = false;
          return;
        }

        txs.transactions.forEach((tx) => {
          if (tx.height < currentHeight - config.latestHeightToNotify) {
            // skip if transaction is too old
            return;
          }

          this.handleTransaction(tx);
        });

        await prisma.cronJobStatus.update({
          where: { jobName: JobName.TRANSACTIONS },
          data: {
            state: JSON.stringify({
              lastHeight: heightToFetch
            })
          }
        });
      } catch (error) {
        logger.error(error, 'Error while running transactions channel job');
      } finally {
        this.isLocked = false;
      }
    });

    this.job.start();
  }

  destroy() {
    if (this.job) {
      this.job.stop();
      logger.info('Stopped TransactionsJob job');
    }

    if (adamantClient.socket) {
      adamantClient.socket.off(this.handleTransaction);
      logger.info('Unsubscribed from ADAMANT sockets');
    }
  }
}

export const transactionsChannel = new TransactionsChannel();
