import { AdamantApi } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { spawnTransactionsJobs } from './transactionsJobs.js'
import { BaseNotificationInterface } from '../adapters/notification/baseNotification.js'
import { spawnRetryNotifyJob } from './retryNotifyJob.js'

export const spawnJobs = (
  adamantClient: AdamantApi,
  notificationService: BaseNotificationInterface,
  prisma: PrismaClient
) => {
  spawnTransactionsJobs(adamantClient, notificationService, prisma)
  spawnRetryNotifyJob(notificationService, prisma)
}
