import { AdamantApi } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { spawnTransactionsJobs } from './transactionsJobs.js'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { spawnRetryNotifyJob } from './retryNotifyJob.js'
import { Logger } from '../types/index.js'

export const spawnJobs = (
  adamantClient: AdamantApi,
  notificationService: BaseNotificationInterface,
  prisma: PrismaClient,
  logger: Logger
) => {
  spawnTransactionsJobs(adamantClient, notificationService, prisma, logger)
  spawnRetryNotifyJob(notificationService, prisma, logger)
}
