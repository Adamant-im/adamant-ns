import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

export const prisma = new PrismaClient()

export const checkConnection = async (client: PrismaClient) => {
  try {
    await client.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    logger.error(e, 'Failed to connect to database')
    return false
  }
}
