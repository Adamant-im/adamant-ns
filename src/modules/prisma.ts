import { PrismaClient } from '@prisma/client'
import { config } from '../config/index.js'
import { logger } from './logger.js'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url
    }
  }
})

export const checkConnection = async (client: PrismaClient) => {
  try {
    await client.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    logger.error(e, 'Failed to connect to database')
    return false
  }
}
