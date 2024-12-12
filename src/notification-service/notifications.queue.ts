import { cargoQueue, QueueObject } from 'async';

import { logger } from '../modules/logger.js';
import { prisma } from '../modules/prisma.js';
import { NotificationPayload } from '../types/db.js';
import { NotificationStatus, PushServiceProvider } from '../types/enums.js';
import {
  invalidTokenErrorCodes,
  isFirebaseError
} from './providers/fcm.provider.js';
import { pushProvider } from './providers/index.js';
import { buildNotification } from './utils.js';

const fcmQueue = cargoQueue<NotificationPayload>(async (tasks) => {
  if (tasks.length > 1) {
    logger.info(`fcmQueue: processing ${tasks.length} notifications`);
    await pushProvider.FCM.messageMany(tasks.map(buildNotification));
  } else if (tasks.length === 1) {
    logger.info(`fcmQueue: processing one notification`);
    const task = tasks[0]!;

    try {
      await pushProvider.FCM.message(buildNotification(task));

      logger.info(
        `Notification ${task.admTxId} sent to ${task.device.admAddress} using ${PushServiceProvider.FCM} provider`
      );
      return prisma.notifications.update({
        where: { id: task.id },
        data: { status: NotificationStatus.Delivered }
      });
    } catch (err) {
      if (isFirebaseError(err) && invalidTokenErrorCodes.includes(err.code)) {
        logger.warn(
          `Device ${task.device.id} of ${task.device.admAddress} expired. Removing device from DB.`
        );
        return prisma.device
          .delete({ where: { id: task.device.id } })
          .then(() => void 0)
          .catch(logger.error);
      }

      logger.error(
        err,
        `Failed to deliver notification to ${task.device.admAddress}. Marking as cancelled.`
      );
      await prisma.notifications.update({
        where: { id: task.id },
        data: { status: NotificationStatus.Cancelled }
      });
    }
  } else {
    logger.warn('fcmQueue: Not tasks to process');
  }
});

const apnsQueue = cargoQueue<NotificationPayload>(async (tasks) => {
  if (tasks.length > 1) {
    logger.info(`apnsQueue: processing ${tasks.length} notifications`);
    await pushProvider.APNS.messageMany(tasks.map(buildNotification));
  } else if (tasks.length === 1) {
    logger.info(`apnsQueue: processing one notification`);
    await pushProvider.APNS.message(buildNotification(tasks[0]!));
  } else {
    logger.warn('apnsQueue: Not tasks to process');
  }
});

export const queue: Record<
  PushServiceProvider,
  QueueObject<NotificationPayload>
> = {
  [PushServiceProvider.APNS]: apnsQueue,
  [PushServiceProvider.FCM]: fcmQueue
};
