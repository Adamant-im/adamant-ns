import { AdamantApi } from 'adamant-api'
import { config } from '../config.js'

export const createAdamantClient = () => {
  return new AdamantApi({
    nodes: config.nodes
  })
}
