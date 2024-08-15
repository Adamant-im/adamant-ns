import { createRoutes } from './routes/index.js'
import { spawnJobs } from './jobs/index.js'
import { config } from './config/index.js'
import { fastify } from './modules/fastify.js'
import { spawnEventHandlers } from './events/handlers.js'
import { prisma } from './modules/prisma.js'
import { logger } from './modules/logger.js'

let runningJobs: ReturnType<typeof spawnJobs> = []

export const main = async () => {
  createRoutes()
  await fastify.listen({ port: config.app.port })

  spawnEventHandlers()
  runningJobs = spawnJobs()
}

export const shutdown = async () => {
  try {
    await fastify.close()
    logger.info('Stopped fastify server')
  } catch (error) {
    logger.error(error, 'Failed to stop fastify server')
    process.exit(1)
  }

  try {
    await prisma.$disconnect()
    logger.info('Stopped prisma connection')
  } catch (error) {
    logger.error(error, 'Failed to stop prisma connection')
    process.exit(1)
  }

  runningJobs.forEach((job) => {
    try {
      job.task.stop()
      logger.info(`Stopped ${job.name} job`)
    } catch (error) {
      logger.error(error, `Failed to stop ${job.name} job`)
      process.exit(1)
    }
  })

  process.exit(0)
}
