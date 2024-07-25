import { PrismaClient } from '@prisma/client'
import { config } from '../config.js'

export const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.database.url
      }
    }
  })
}

export const checkConnection = async (client: PrismaClient) => {
  try {
    await client.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    return false
  }
}
