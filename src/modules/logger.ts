import path from 'path'
import { createLogger as createPinoLogger } from 'adamant-module-logger'
import { config } from '../config/index.js'

export const { logger, middlewareLogger } = createPinoLogger(
  {
    name: config.app.name
  },
  {
    destination: path.join(config.app.projectRoot, 'logs')
  }
)
