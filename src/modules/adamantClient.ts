import { AdamantApi } from 'adamant-api';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export const adamantClient = new AdamantApi({
  nodes: config.admNodes
});
adamantClient.initSocket({
  wsType: 'ws',
  admAddress: config.admAddress
});

export const isReady = () => {
  const EXPECTED_READY_IN = 30; // seconds

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      logger.error(`ADAMANT API Client not ready in ${EXPECTED_READY_IN}s`);
      reject(false);
    }, EXPECTED_READY_IN * 1000);

    adamantClient.onReady(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });
};
