import Fastify, { FastifyBaseLogger } from 'fastify'

import { createPrismaClient } from './modules/prisma.js'
import { createRoutes } from './routes/index.js'
import { createLogger } from './modules/logger.js'
import { spawnJobs } from './jobs/index.js'
import { config } from './config.js'
import { createAdamantClient } from './modules/adamantClient.js'
import { createFcmClient } from './modules/fcmClient.js'
import { FcmNotification } from './adapters/notification/fcmNotification.js'

export const main = async () => {
  const { logger } = createLogger()
  const fastify = Fastify({ logger: logger as FastifyBaseLogger })
  const prisma = createPrismaClient()
  const adamantClient = createAdamantClient()

  let notificationService

  if (config.app.notificationService === 'FCM') {
    const fcmClient = createFcmClient()
    notificationService = new FcmNotification(fcmClient)
  }

  createRoutes(fastify, prisma)
  await fastify.listen({ port: config.app.port })

  if (notificationService) {
    spawnJobs(adamantClient, notificationService, prisma, logger)
  }
}
