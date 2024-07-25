import path from 'path'
import { createLogger as createPinoLogger } from 'adamant-module-logger'
import { config } from '../config.js'

export const createLogger = () => {
  return createPinoLogger(
    {
      name: config.app.name
    },
    {
      destination: path.join(config.app.projectRoot, 'logs')
    }
  )
}
