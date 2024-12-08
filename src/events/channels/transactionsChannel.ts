import EventEmitter from 'events';
import { AnyTransaction } from 'adamant-api';
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js';

import { logger } from '../../modules/logger.js';
import { config } from '../../config/index.js';
import { adamantClient, isReady } from '../../modules/adamantClient.js';
import { isSignalTx } from '../../services/parser/isSignalTx.js';
import { isTxToNotify } from '../../services/parser/isTxToNotify.js';

class TransactionsChannel extends EventEmitter {
  /**
   * The height of the last block from which transactions were processed.
   */
  private lastHeight = 0;

  async init() {
    await isReady();

    // Save current block height
    const currentHeight = await this.getHeight();
    this.lastHeight = currentHeight - config.latestHeightToNotify;

    // Download history transactions and process them
    const transactions = await this.fetchTransactions();
    for (const transaction of transactions) {
      this.handleTransaction(transaction);
    }

    // Start watching new transaction using WS
    if (adamantClient.socket) {
      adamantClient.socket.on(this.handleTransaction);
      adamantClient.socket.catch((error) => logger.error(error));

      logger.info(
        'Subscribed to ADAMANT sockets. Watching for new transactions in realtime.'
      );
    } else {
      logger.error(
        'ADAMANT sockets are not enabled. Using REST as a fallback.'
      );
      process.exit(1);
    }
  }

  /**
   * Returns current node's blockchain height
   */
  private async getHeight() {
    const response = await adamantClient.getHeight();

    if (response.success) {
      return response.height;
    }

    throw new Error(
      `Failed to get the ADAMANT node height. Error: ${response.errorMessage}`
    );
  }

  /**
   * Handler for incoming transactions:
   * - If the transaction is a Signal Message, emits a `newSignalMessage` event.
   * - If the transaction is a Message, emits a `newMessage` event.
   *
   * Other types of transactions are ignored.
   *
   * @param tx - The transaction to handle.
   */
  private handleTransaction = (tx: AnyTransaction) => {
    this.lastHeight = tx.height;

    if (isSignalTx(tx)) {
      logger.info(
        `Got signal transaction to (un)subscribe to notifications, txId: ${tx.id}, processing...`
      );
      this.emit('newSignalMessage', tx as ChatMessageTransaction);
    } else if (isTxToNotify(tx)) {
      this.emit('newMessage', tx);
    }
  };

  /**
   * Download transactions from the history for last N blocks by REST API.
   * This ensures no transactions were missed while the service was down.
   * Must be called before subscribing to the WebSockets.
   *
   * @returns List of transactions
   */
  private async fetchTransactions() {
    const PER_PAGE = 100;
    const allTransactions: AnyTransaction[] = [];

    let offset = 0;
    let transactionsCount = 1;

    logger.info(
      `Downloading transactions for last ${config.latestHeightToNotify} blocks...`
    );

    let loopCounter = 0;
    do {
      loopCounter++;

      const response = await adamantClient.getTransactions({
        orderBy: 'timestamp:desc',
        returnAsset: 1,
        fromHeight: this.lastHeight,
        limit: PER_PAGE,
        offset
      });

      if (!response.success) {
        throw new Error(
          `Failed to query transactions (fromHeight: ${this.lastHeight}, offset: ${offset}). Error: ${response.errorMessage}`
        );
      }

      const { transactions, count } = response;
      allTransactions.push(...transactions);

      transactionsCount = transactions.length;
      offset += PER_PAGE;

      if (response.transactions.length > 0) {
        logger.info(
          `(${loopCounter}) Fetched ${response.transactions.length} transactions (${allTransactions.length} of ${count})`
        );
      } else {
        logger.info(`(${loopCounter}) Fetching done`);
      }
    } while (transactionsCount > 0);

    return allTransactions;
  }

  destroy() {
    if (adamantClient.socket) {
      adamantClient.socket.off(this.handleTransaction);
      logger.info('Unsubscribed from ADAMANT sockets');
    }
  }
}

export const transactionsChannel = new TransactionsChannel();
