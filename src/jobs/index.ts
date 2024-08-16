import { transactionsChannel } from '../events/channels/transactionsChannel.js'
import { spawnRetryNotifyJob } from './retryNotifyJob.js'

export const spawnJobs = () => {
  const transactionJob = transactionsChannel.startJob()
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
