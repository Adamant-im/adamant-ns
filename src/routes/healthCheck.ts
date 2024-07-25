import { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { checkConnection } from '../modules/prisma.js'
import { PrismaClient } from '@prisma/client'

export const createHealthCheckRoutes = (
  fastify: FastifyInstance,
  prisma: PrismaClient
) => {
  fastify.get('/', async function (_request, reply) {
    reply.send({
      timestamp: new Date().toISOString(),
      version: config.app.version,
      databaseConnection: await checkConnection(prisma)
    })
  })
}
