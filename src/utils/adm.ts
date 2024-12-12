import { ChatMessageTransaction, decodeMessage } from 'adamant-api';

import { SignalTransaction } from '../adamant/types.js';
import { config } from '../config/index.js';
import { ZSignalMessagePayload } from '../types/api.js';

export function decodeAssetMessage(
  tx: SignalTransaction | ChatMessageTransaction
) {
  try {
    const decodedMessage = decodeMessage(
      tx.asset?.chat?.message,
      tx.senderPublicKey,
      config.passPhrase,
      tx.asset?.chat?.own_message
    );

    const { data } = ZSignalMessagePayload.safeParse(
      JSON.parse(decodedMessage)
    );

    return data || null;
  } catch (err) {
    return null;
  }
}
