import path from 'path'
import { createLogger } from 'adamant-module-logger'

import { config } from '../config/index.js'

export const { logger } = createLogger(
  { name: config.app.name },
  {
    destination: path.join(config.app.projectRoot, 'logs')
  }
)
