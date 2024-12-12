import { App } from './app.js';
import { config } from './config/index.js';
import { server } from './server.js';
import { queue } from './notification-service/notifications.queue.js';
import { prisma } from './modules/prisma.js';
import { logger } from './modules/logger.js';

await server.listen({ port: config.app.port });

const app = new App();
await app.init();

export const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    // Stop server and unsubscribe from transactions
    await server.close();
    await app.destroy();
    logger.info('Server stopped');

    // Drain transactions queue
    await queue.FCM.drain();
    await queue.APNS.drain();
    logger.info('Queue drained');

    // Close DB connection
    await prisma.$disconnect();
    logger.info('DB connection closed');

    process.exit(0);
  } catch (err) {
    logger.error(err, 'Failed to shutdown gracefully');
    process.exit(1);
  }
};
