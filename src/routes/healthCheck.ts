import { config } from '../config/index.js'
import { checkConnection } from '../modules/prisma.js'
import { prisma } from '../modules/prisma.js'
import { fastify } from '../modules/fastify.js'

export const createHealthCheckRoutes = () => {
  fastify.get('/', async function (_request, reply) {
    reply.send({
      timestamp: new Date().toISOString(),
      version: config.app.version,
      databaseConnection: await checkConnection(prisma)
    })
  })
}
