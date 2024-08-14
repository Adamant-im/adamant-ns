import { createRoutes } from './routes/index.js'
import { spawnJobs } from './jobs/index.js'
import { config } from './config/index.js'
import { fastify } from './modules/fastify.js'

export const main = async () => {
  createRoutes()
  await fastify.listen({ port: config.app.port })

  spawnJobs()
}
