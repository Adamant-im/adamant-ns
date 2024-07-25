import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import {
  createAddressFromPublicKey,
  createKeypairFromPassphrase
} from 'adamant-api'

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

export const config = {
  app: {
    name: 'adamant-ns',
    version: packageFile.version,
    port: configFile.app.port,
    projectRoot,
    notificationExpiryHours: configFile.notificationExpiryHours,
    txCheckInterval: '*/4 * * * * *', // in cron language
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
