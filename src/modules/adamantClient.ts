import { AdamantApi } from 'adamant-api';
import { config } from '../config/index.js';

export const adamantClient = new AdamantApi({
  nodes: config.admNodes
});

adamantClient.initSocket({
  wsType: 'ws',
  admAddress: config.admAddress
});
