import { createHealthCheckRoutes } from './healthCheck.js'
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

export const createRoutes = (
  fastify: FastifyInstance,
  prisma: PrismaClient
) => {
  createHealthCheckRoutes(fastify, prisma)
}
