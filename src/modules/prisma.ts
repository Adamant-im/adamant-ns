import { PrismaClient } from '@prisma/client'
import { index } from '../config/index.js'

export const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: index.database.url
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
