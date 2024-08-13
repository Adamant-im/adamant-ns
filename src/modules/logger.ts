import path from 'path'
import { createLogger as createPinoLogger } from 'adamant-module-logger'
import { index } from '../config/index.js'

export const createLogger = () => {
  return createPinoLogger(
    {
      name: index.app.name
    },
    {
      destination: path.join(index.app.projectRoot, 'logs')
    }
  )
}
