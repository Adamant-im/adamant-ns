import { AnyTransaction, decodeMessage } from 'adamant-api';
import { config } from '../../config/index.js';
import { BigNumber } from 'bignumber.js';

export const createNotificationBody = (tx: AnyTransaction) => {
  const notification = {
    title: '',
    body: ''
  };

  if (tx.type === 8 && !tx.amount) {
    const decryptedMessage = decodeMessage(
      tx.asset?.chat?.message,
      tx.senderPublicKey,
      config.adamantAccount.passPhrase,
      tx.asset?.chat?.own_message
    ).trim();

    notification.title = `Message from ${tx.senderId}`;
    notification.body =
      decryptedMessage.length > 64
        ? decryptedMessage.substring(0, 64) + '...'
        : decryptedMessage;
  } else if (tx.amount) {
    const amount = new BigNumber(tx.amount)
      .dividedBy(new BigNumber(1e8))
      .toString();
    const fee = new BigNumber(tx.fee).dividedBy(new BigNumber(1e8)).toString();
    notification.title = `Transfer from ${tx.senderId}`;
    notification.body = `Amount: ${amount}, fee: ${fee}`;
  }

  return notification;
};
