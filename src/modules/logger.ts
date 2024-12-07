import path from 'path';
import { createLogger } from 'adamant-module-logger';

import { config } from '../config/index.js';

export const { logger } = createLogger(
  { name: config.appName },
  {
    destination: path.join(config.projectRoot, 'logs')
  }
);
