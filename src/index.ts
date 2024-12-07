import { main, shutdown } from './main.js';
import { logger } from './modules/logger.js';

main().catch(async (e) => {
  logger.error(e);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
  logger.error(err);
  shutdown().finally(() => process.exit(1));
});
