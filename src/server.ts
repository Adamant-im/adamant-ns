import { fastify } from 'fastify'

import { config } from './config/index.js'
import { logger } from './modules/logger.js'
import { checkConnection } from './modules/prisma.js'

export const server = fastify({ logger })

server.get('/', async (_req, reply) => {
  reply.send({
    timestamp: new Date().getTime(),
    version: config.app.version,
    databaseConnection: await checkConnection()
  })
})
