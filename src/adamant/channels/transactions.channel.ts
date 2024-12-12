import { AnyTransaction } from 'adamant-api';
import { clearTimeout } from 'node:timers';

import { logger } from '../../modules/logger.js';
import { config } from '../../config/index.js';
import { TypedEventEmitter } from '../../utils/typed-emitter.js';
import { adamantClient } from '../client.js';
import { isReady } from '../utils.js';
import {
  MessageTransaction,
  SignalTransaction,
  TokenTransaction
} from '../types.js';
import { isChatMessage, isSignalMessage, isTokenTransfer } from '../guards.js';

const TRANSACTIONS_PER_PAGE = 100;
const POLLING_INTERVAL = 3000;

const Event = {
  SignalMessage: 'newSignalMessage',
  ChatMessage: 'newMessage'
} as const;
type Event = (typeof Event)[keyof typeof Event];

type TransactionMap = {
  [Event.SignalMessage]: (transaction: SignalTransaction) => void;
  [Event.ChatMessage]: (
    transaction: TokenTransaction | MessageTransaction
  ) => void;
};

export class TransactionsChannel extends TypedEventEmitter<TransactionMap> {
  /**
   * The height of the last block from which transactions were processed.
   */
  private lastHeight = 0;
  private timer: NodeJS.Timeout | undefined;

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
        `Subscribed to ADAMANT sockets with address ${config.admAddress}. Watching for new transactions in realtime.`
      );
    } else {
      logger.error(
        'ADAMANT sockets are not enabled. Using REST as a fallback.'
      );
      process.exit(1);
    }

    // Watch transaction using REST API
    this.watchTransactions();
  }

  /**
   * Watch transactions using REST API.
   */
  private watchTransactions() {
    const handler = async () => {
      try {
        const height = await this.getHeight();
        const response = await adamantClient.getTransactions({
          orderBy: 'timestamp:desc',
          returnAsset: 1,
          fromHeight: height,
          limit: TRANSACTIONS_PER_PAGE,
          offset: 0
        });
        if (!response.success) {
          throw new Error(
            `Failed to query transactions (fromHeight: ${this.lastHeight}). Error: ${response.errorMessage}`
          );
        }

        const { transactions } = response;
        if (transactions.length > 0) {
          logger.info(
            `Fetched ${transactions.length} transactions by REST (height: ${height})`
          );
        }

        for (const transaction of transactions) {
          this.handleTransaction(transaction);
        }

        if (height > this.lastHeight) {
          this.lastHeight = height;
        }
      } catch (err) {
        logger.warn(err, 'Failed to fetch transactions by REST');
      } finally {
        this.timer = setTimeout(handler, POLLING_INTERVAL);
      }
    };

    void handler();
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

    if (isSignalMessage(tx)) {
      logger.info(
        `Got signal transaction to (un)subscribe to notifications, txId: ${tx.id}, processing...`
      );
      this.emit(Event.SignalMessage, tx);
    } else if (isChatMessage(tx) || isTokenTransfer(tx)) {
      this.emit(Event.ChatMessage, tx);
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
        limit: TRANSACTIONS_PER_PAGE,
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
      offset += TRANSACTIONS_PER_PAGE;

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

    clearTimeout(this.timer);
    logger.info('Transactions fetcher disabled');
  }
}
