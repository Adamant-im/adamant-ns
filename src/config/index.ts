import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import {
  createAddressFromPublicKey,
  createKeypairFromPassphrase
} from 'adamant-api'
import { schema } from './schema.js'
import { fromZodError } from '../utils/zod.js'

const projectRoot = process.cwd()

interface ConfigFile {
  database: {
    url: string
  }
  app: {
    port: number
  }
  notificationExpiryHours: number
  admNodes: string[]
  passPhrase: string
  notifyTxTypes: number[]
  chatTxTypeIncludeSubtype: number[]
  notificationService: 'FCM' | 'APNS'
}

interface PackageFile {
  version: string
}

const configFile = JSON5.parse(
  fs.readFileSync(path.join(projectRoot, 'config.json5'), 'utf8')
) as ConfigFile
const packageFile = JSON5.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
) as PackageFile

const result = schema.safeParse(configFile)

if (!result.success) {
  const message = fromZodError(result.error)

  throw new Error(`Service's config is wrong:\n${message}Cannot start the bot.`)
}

export const index = {
  app: {
    name: 'adamant-ns',
    version: packageFile.version,
    port: configFile.app.port,
    projectRoot,
    notificationExpiryHours: configFile.notificationExpiryHours,
    txCheckInterval: '*/4 * * * * *', // in cron language
    retryNotifyInterval: '*/4 * * * * *', // */10 * * * * in cron language
    heightSkipPerHeight: 1,
    notificationService: configFile.notificationService
  },
  database: {
    url: configFile.database.url
  },
  nodes: configFile.admNodes,
  notify: {
    passPhrase: configFile.passPhrase,
    notifyTxTypes: configFile.notifyTxTypes,
    chatTxTypeIncludeSubtype: configFile.chatTxTypeIncludeSubtype
  },
  adamantAccount: {
    passPhrase: configFile.passPhrase,
    address: createAddressFromPublicKey(
      createKeypairFromPassphrase(configFile.passPhrase).publicKey
    )
  }
}
