import { createLogger } from '../modules/logger.js'

export type Logger = ReturnType<typeof createLogger>['logger']
