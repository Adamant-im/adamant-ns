import { FastifyInstance } from 'fastify'
import { index } from '../config/index.js'
import { checkConnection } from '../modules/prisma.js'
import { PrismaClient } from '@prisma/client'

export const createHealthCheckRoutes = (
  fastify: FastifyInstance,
  prisma: PrismaClient
) => {
  fastify.get('/', async function (_request, reply) {
    reply.send({
      timestamp: new Date().toISOString(),
      version: index.app.version,
      databaseConnection: await checkConnection(prisma)
    })
  })
}
