import { AdamantApi } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { spawnTransactionsJobs } from './transactionsJobs.js'
import { BaseNotification } from '../adapters/notification/baseNotification.js'

export const spawnJobs = (
  adamantClient: AdamantApi,
  notificationService: BaseNotification,
  prisma: PrismaClient
) => {
  spawnTransactionsJobs(adamantClient, notificationService, prisma)
}
