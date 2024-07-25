import Fastify from 'fastify'

import { createPrismaClient } from './modules/prisma.js'
import { createRoutes } from './routes/index.js'
import { createLogger } from './modules/logger.js'
import { spawnJobs } from './jobs/index.js'
import { config } from './config.js'
import { createAdamantClient } from './modules/adamantClient.js'
import { createFcmClient } from './modules/fcmClient.js'
import { FcmNotification } from './adapters/notification/fcmNotification.js'
import { BaseNotification } from './adapters/notification/baseNotification.js'

export const main = async () => {
  const { logger } = createLogger()
  const fastify = Fastify({ logger })
  const prisma = createPrismaClient()
  const adamantClient = createAdamantClient()

  let notificationService = new BaseNotification()

  if (config.app.notificationService === 'FCM') {
    const fcmClient = createFcmClient()
    notificationService = new FcmNotification(fcmClient)
  }

  createRoutes(fastify, prisma)
  await fastify.listen({ port: config.app.port })

  spawnJobs(adamantClient, notificationService, prisma)
}
