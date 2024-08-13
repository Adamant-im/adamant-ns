import { AdamantApi } from 'adamant-api'
import { index } from '../config/index.js'

export const createAdamantClient = () => {
  return new AdamantApi({
    nodes: index.nodes
  })
}
