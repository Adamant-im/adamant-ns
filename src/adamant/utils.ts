import { logger } from '../modules/logger.js';
import { adamantClient } from './client.js';

/**
 * Promisify ADAMANT API Client readiness callback.
 */
export function isReady() {
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
}
