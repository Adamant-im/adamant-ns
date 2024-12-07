import EventEmitter from 'events';
import { AnyTransaction, WebSocketClient } from 'adamant-api';
import { schedule, ScheduledTask } from 'node-cron';
import { logger } from '../../modules/logger.js';
import { config } from '../../config/index.js';
import { adamantClient } from '../../modules/adamantClient.js';
import { prisma } from '../../modules/prisma.js';
import { JobName } from '@prisma/client';
import { isSignalTx } from '../../services/parser/isSignalTx.js';
import { isTxToNotify } from '../../services/parser/isTxToNotify.js';
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js';

class TransactionsChannel extends EventEmitter {
  // Specify types of events
  override emit(event: 'newSignalMessage', tx: ChatMessageTransaction): boolean;
  override emit(event: 'newMessage', tx: AnyTransaction): boolean;
  override emit(event: string, ...args: never[]): boolean {
    return super.emit(event, ...args);
  }

  override on(
    event: 'newSignalMessage',
    listener: (tx: ChatMessageTransaction) => void
  ): this;
  override on(
    event: 'newMessage',
    listener: (tx: AnyTransaction) => void
  ): this;
  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  private isLocked: boolean;
  private job?: ScheduledTask;
  private processedTxs: { [key: string]: AnyTransaction } = {}; // cache for processed transactions
  adamantSocket?: WebSocketClient;
  private readonly handleTransactionRef: (tx: AnyTransaction) => void;

  constructor() {
    super();
    this.isLocked = false;
    this.handleTransactionRef = this.handleTransaction.bind(this);
  }

  initSocket() {
    adamantClient.initSocket({
      wsType: 'ws',
      admAddress: config.adamantAccount.address
    });
    logger.info(
      `Adamant Client socket initialized on ${config.adamantAccount.address} address`
    );

    if (adamantClient.socket) {
      adamantClient.socket.on(this.handleTransactionRef);
      adamantClient.socket.catch((error) => logger.error(error));

      this.adamantSocket = adamantClient.socket;
    }
  }

  startJob() {
    logger.info(
      `Spawned transaction parser job with ${config.app.txCheckInterval} interval`
    );
    this.job = schedule(config.app.txCheckInterval, async () => {
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
        let heightToFetch = lastCheckHeight + config.app.heightSkipPerHeight;

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
          if (tx.height < currentHeight - config.notify.latestHeightToNotify) {
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

  handleTransaction(tx: AnyTransaction) {
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
  }

  destroy() {
    if (this.job) {
      this.job.stop();
      logger.info('Stopped TransactionsJob job');
    }

    if (this.adamantSocket) {
      this.adamantSocket.off(this.handleTransactionRef);
      logger.info('Unsubscribed from adamant socket events');
    }
  }
}

export const transactionsChannel = new TransactionsChannel();
