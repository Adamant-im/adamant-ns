import EventEmitter from 'events';
import {
  AnyTransaction,
  ChatMessageAsset,
  TokenTransferTransaction
} from 'adamant-api';
import { ChatMessageTransaction } from 'adamant-api/dist/api/generated.js';

import { logger } from '../../modules/logger.js';
import { config } from '../../config/index.js';
import { adamantClient, isReady } from '../../modules/adamantClient.js';
import { isSignalTx } from '../../services/parser/isSignalTx.js';
import { isTxToNotify } from '../../services/parser/isTxToNotify.js';

const Event = {
  SignalMessage: 'newSignalMessage',
  ChatMessage: 'newMessage'
} as const;
type Event = (typeof Event)[keyof typeof Event];

type SignalTransaction = Omit<ChatMessageTransaction, 'asset'> & {
  asset: Omit<ChatMessageAsset, 'chat'> & {
    chat: Omit<ChatMessageAsset['chat'], 'type'> & { type: 3 };
  };
};

type MessageTransaction = Omit<ChatMessageTransaction, 'asset'> & {
  asset: Omit<ChatMessageAsset, 'chat'> & {
    chat: Omit<ChatMessageAsset['chat'], 'type'> & { type: 1 | 2 };
  };
};

type TokenTransaction = Omit<TokenTransferTransaction, 'asset'> & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  asset: {};
};

type TransactionMap = {
  [Event.SignalMessage]: SignalTransaction;
  [Event.ChatMessage]: TokenTransaction | MessageTransaction;
};

class TransactionsChannel<T extends TransactionMap> extends EventEmitter {
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
      this.emit(Event.SignalMessage, tx as TransactionMap['newSignalMessage']);
    } else if (isTxToNotify(tx)) {
      this.emit(Event.ChatMessage, tx as TransactionMap['newMessage']);
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

  /**
   * Adds an event listener handler for the specific transaction types.
   */
  on<K extends keyof T>(event: K, listener: (transaction: T[K]) => void) {
    return super.on(event as string, listener);
  }

  emit<K extends keyof T>(event: K, transaction: T[K]) {
    return super.emit(event as string, transaction);
  }
}

export const transactionsChannel = new TransactionsChannel();
