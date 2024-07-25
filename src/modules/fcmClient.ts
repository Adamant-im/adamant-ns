import { config } from '../config.js'
import JSON5 from 'json5'
import fs from 'fs'
import path from 'path'
import admin, { ServiceAccount } from 'firebase-admin'

export const createFcmClient = () => {
  const credentials = JSON5.parse(
    fs.readFileSync(
      path.join(config.app.projectRoot, 'firebase-credentials.json'),
      'utf8'
    )
  ) as ServiceAccount

  return admin.initializeApp({
    credential: admin.credential.cert(credentials)
  })
}
