import {
  ChatMessageAsset,
  ChatMessageTransaction,
  TokenTransferTransaction
} from 'adamant-api';

export type SignalTransaction = Omit<ChatMessageTransaction, 'asset'> & {
  asset: Omit<ChatMessageAsset, 'chat'> & {
    chat: Omit<ChatMessageAsset['chat'], 'type'> & { type: 3 };
  };
};

export type MessageTransaction = Omit<ChatMessageTransaction, 'asset'> & {
  asset: Omit<ChatMessageAsset, 'chat'> & {
    chat: Omit<ChatMessageAsset['chat'], 'type'> & { type: 1 | 2 };
  };
};

export type TokenTransaction = Omit<TokenTransferTransaction, 'asset'> & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  asset: {};
};
