import { config } from '../../config/index.js';
import { AnyTransaction, decodeMessage } from 'adamant-api';
import { TSignalMessagePayload } from '../../types/models.js';

export const isSignalTx = (tx: AnyTransaction) => {
  if (
    tx.recipientId === config.adamantAccount.address &&
    tx.type === 8 &&
    tx.asset?.chat?.type === 3
  ) {
    const decryptedMessage = JSON.parse(
      decodeMessage(
        tx.asset?.chat?.message,
        tx.senderPublicKey,
        config.adamantAccount.passPhrase,
        tx.asset?.chat?.own_message
      ).trim()
    ) as TSignalMessagePayload;
    if (
      decryptedMessage['token'] &&
      decryptedMessage['provider'] &&
      decryptedMessage['action']
    ) {
      return true;
    }
  }

  return false;
};
