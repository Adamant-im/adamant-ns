import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import {
  createAddressFromPublicKey,
  createKeypairFromPassphrase
} from 'adamant-api'
import { schema, Schema as ConfigSchema } from './schema.js'
import { fromZodError } from '../utils/zod.js'

const projectRoot = process.cwd()

interface PackageFile {
  version: string
}

const configFile = JSON5.parse(
  fs.readFileSync(path.join(projectRoot, 'config.json5'), 'utf8')
) as ConfigSchema
const packageFile = JSON5.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
) as PackageFile

const result = schema.safeParse(configFile)

if (!result.success) {
  const message = fromZodError(result.error)

  throw new Error(`Service's config is wrong:\n${message}Cannot start the bot.`)
}

export const config = {
  app: {
    name: 'adamant-ns',
    version: packageFile.version,
    port: configFile.app.port,
    projectRoot,
    notificationExpiryHours: configFile.notificationExpiryHours,
    txCheckInterval: '*/4 * * * * *', // in cron language
    retryNotifyInterval: '*/4 * * * * *', // */10 * * * * in cron language
    heightSkipPerHeight: 1
  },
  nodes: configFile.admNodes,
  notify: {
    passPhrase: configFile.passPhrase,
    notifyTxTypes: configFile.notifyTxTypes,
    chatTxTypeIncludeSubtype: configFile.chatTxTypeIncludeSubtype,
    latestHeightToNotify: configFile.latestHeightToNotify
  },
  adamantAccount: {
    passPhrase: configFile.passPhrase,
    address: createAddressFromPublicKey(
      createKeypairFromPassphrase(configFile.passPhrase).publicKey
    )
  }
}
