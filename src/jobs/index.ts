import { spawnTransactionsJobs } from './transactionsJobs.js'
import { spawnRetryNotifyJob } from './retryNotifyJob.js'

export const spawnJobs = () => {
  const transactionJob = spawnTransactionsJobs()
  const retryNotifyJob = spawnRetryNotifyJob()

  transactionJob.start()
  retryNotifyJob.start()

  return [
    {
      name: 'TransactionJob',
      task: transactionJob
    },
    {
      name: 'RetryNotifyJob',
      task: retryNotifyJob
    }
  ]
}
