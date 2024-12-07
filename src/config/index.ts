import path from 'path';
import { readFileSync } from 'fs';
import JSON5 from 'json5';
import {
  createAddressFromPublicKey,
  createKeypairFromPassphrase
} from 'adamant-api';
import { getAppName, getAppVersion } from '../utils/app.js';

import { fromZodError } from '../utils/zod.js';
import { TConfigSchema, ZConfigSchema } from './schema.js';

const PROJECT_ROOT = process.cwd();

export function parseConfig(): TConfigSchema {
  const configRaw = readFileSync(
    path.join(PROJECT_ROOT, 'config.json5'),
    'utf8'
  );

  const config = JSON5.parse<TConfigSchema>(configRaw);
  const { success, data, error } = ZConfigSchema.safeParse(config);

  if (!success) {
    const message = fromZodError(error);
    throw new Error(`Service's config is wrong:\n${message}`);
  }

  return data;
}

const jsonConfig = parseConfig();

export const keyPair = createKeypairFromPassphrase(jsonConfig.passPhrase);

export const config = {
  ...jsonConfig,
  admAddress: createAddressFromPublicKey(keyPair.publicKey),
  appName: getAppName(),
  appVersion: getAppVersion(),
  projectRoot: PROJECT_ROOT,
  txCheckInterval: '*/4 * * * * *', // in cron language
  retryNotifyInterval: '*/4 * * * * *', // */10 * * * * in cron language
  heightSkipPerHeight: 1
};
