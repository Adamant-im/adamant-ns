import { AnyTransaction, decodeMessage, TransactionType } from 'adamant-api';

import { config } from '../config/index.js';
import { logger } from '../modules/logger.js';

import { ZSignalMessagePayload } from '../types/api.js';
import {
  MessageTransaction,
  SignalTransaction,
  TokenTransaction
} from './types.js';

export const isSignalMessage = (
  tx: AnyTransaction
): tx is SignalTransaction => {
  if (tx.type !== TransactionType.CHAT_MESSAGE) return false;
  if (tx.asset?.chat?.type !== 3) return false;
  if (tx.recipientId !== config.admAddress) {
    logger.info(
      `Transaction ${tx.id} has a different recipient (${tx.recipientId}) from ANS (${config.admAddress}). Ignoring.`
    );
    return false;
  }

  try {
    const decryptedMessage = JSON.parse(
      decodeMessage(
        tx.asset?.chat?.message,
        tx.senderPublicKey,
        config.passPhrase,
        tx.asset?.chat?.own_message
      )
    ) as unknown;

    const { success } = ZSignalMessagePayload.safeParse(decryptedMessage);
    console.log(tx.id, decryptedMessage, success);

    return success;
  } catch (err) {
    logger.error(err);

    return false;
  }
};

export const isChatMessage = (
  transaction: AnyTransaction
): transaction is MessageTransaction => {
  return transaction.type === TransactionType.CHAT_MESSAGE;
};

export const isTokenTransfer = (
  transaction: AnyTransaction
): transaction is TokenTransaction => {
  return transaction.type === TransactionType.SEND;
};
