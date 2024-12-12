import { AnyTransaction } from 'adamant-api';
import { isTokenTransfer } from '../adamant/guards.js';
import { NotificationPayload } from '../types/db.js';
import { NotificationMessage } from './providers/notification-provider.interface.js';

export function buildNotification(
  notification: NotificationPayload
): NotificationMessage {
  const txn = notification.admTx as unknown as AnyTransaction;

  const satoshiToAdams = (amount: number) => amount / 1e8;

  const title = txn.senderId;
  const body = isTokenTransfer(txn)
    ? `Transfer of ${satoshiToAdams(txn.amount)}`
    : `You received a new message from ${txn.senderId}`;

  return {
    token: notification.device.pushToken,
    title,
    body,
    data: {
      'push-recipient': 'U3716604363012166999', // backward compatible with old push service
      'txn-id': '1780057658950425716', // backward compatible with old push service
      txn: JSON.stringify(txn) // Firebase limitation: data must only contain string values
    }
  };
}
