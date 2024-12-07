import { config } from '../../config/index.js';
import { AnyTransaction } from 'adamant-api';

export const isTxToNotify = (tx: AnyTransaction) => {
  if (config.notifyTxTypes.includes(tx.type)) {
    if (
      !(
        tx.type === 8 &&
        config.chatTxTypeIncludeSubtype.includes(tx.asset?.chat?.type)
      )
    ) {
      return false;
    }

    return true;
  }

  return false;
};
