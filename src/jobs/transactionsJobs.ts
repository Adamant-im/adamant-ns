import { schedule } from 'node-cron'
import { config } from '../config/index.js'
import { JobName } from '@prisma/client'
import { prisma } from '../modules/prisma.js'
import { adamantClient } from '../modules/adamantClient.js'
import { logger } from '../modules/logger.js'
import { transactionsChannel } from '../events/channels.js'

export const spawnTransactionsJobs = () => {
  let isLocked = false

  adamantClient.initSocket({
    wsType: 'ws',
    admAddress: config.adamantAccount.address
  })
  logger.info(
    `Adamant Client socket initialized on ${config.adamantAccount.address} address`
  )
  adamantClient.socket?.on((tx) => {
    transactionsChannel.emit('newTransaction', tx)
  })
  adamantClient.socket?.catch((error) => logger.error(error))

  logger.info(
    `Spawned transaction parser job with ${config.app.txCheckInterval} interval`
  )

  return schedule(config.app.txCheckInterval, async () => {
    if (isLocked) return

    isLocked = true

    const getHeightResponse = await adamantClient.getHeight()
    const currentHeight = getHeightResponse.success
      ? getHeightResponse.height
      : 0

    let jobStatus = await prisma.cronJobStatus.findFirst({
      where: { jobName: JobName.TRANSACTIONS }
    })

    if (!jobStatus) {
      jobStatus = await prisma.cronJobStatus.create({
        data: {
          jobName: JobName.TRANSACTIONS,
          state: JSON.stringify({
            lastHeight: currentHeight
          })
        }
      })
    }

    const lastCheckHeight = (
      JSON.parse(jobStatus.state as string) as { lastHeight: number }
    ).lastHeight

    // Determine fetch interval
    let heightToFetch = lastCheckHeight + config.app.heightSkipPerHeight

    if (heightToFetch > currentHeight) {
      isLocked = false
      return
    }

    if (currentHeight - heightToFetch > 1) {
      // If the gap is more than 1 block, fetch transactions in chunks of 1000 blocks
      heightToFetch = lastCheckHeight + 1000

      if (currentHeight - heightToFetch < 0) {
        // if the gap reaches currenHeight and more, than set it to currentHeight
        heightToFetch = currentHeight
      }
    }

    const txs = await adamantClient.getTransactions({
      fromHeight: lastCheckHeight,
      and: {
        toHeight: heightToFetch
      },
      returnAsset: 1
    })

    if (!txs.success) {
      isLocked = false
      return
    }

    txs.transactions.forEach((tx) => {
      transactionsChannel.emit('newTransaction', tx)
    })

    await prisma.cronJobStatus.update({
      where: { jobName: JobName.TRANSACTIONS },
      data: {
        state: JSON.stringify({
          lastHeight: heightToFetch
        })
      }
    })

    isLocked = false
  })
}
