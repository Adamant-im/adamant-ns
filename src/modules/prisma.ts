import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

export const prisma = new PrismaClient()

/**
 * Checks the database connection.
 *
 * @returns `true` if the connection is still alive, otherwise `false`.
 */
export const checkConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    logger.error(e, 'Failed to connect to the database')
    return false
  }
}
