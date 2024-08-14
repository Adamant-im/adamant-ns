import { spawnTransactionsJobs } from './transactionsJobs.js'
import { spawnRetryNotifyJob } from './retryNotifyJob.js'

export const spawnJobs = () => {
  spawnTransactionsJobs()
  spawnRetryNotifyJob()
}
