import { AdamantApi } from 'adamant-api'
import { PrismaClient } from '@prisma/client'
import { schedule } from 'node-cron'
import { config } from '../config.js'
import { JobName } from '@prisma/client'
import { txsParser } from '../services/txsParser.js'
import { BaseNotification } from '../adapters/notification/baseNotification.js'

export const spawnTransactionsJobs = (
  adamantClient: AdamantApi,
  notificationService: BaseNotification,
  prisma: PrismaClient
) => {
  let isLocked = false

  adamantClient.initSocket({
    wsType: 'ws',
    admAddress: config.adamantAccount.address
  })
  adamantClient.socket?.on((tx) => txsParser(prisma, notificationService, tx))

  schedule(config.app.txCheckInterval, async () => {
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

    if (lastCheckHeight + config.app.heightSkipPerHeight >= currentHeight) {
      isLocked = false
      return
    }

    const txs = await adamantClient.getTransactions({
      fromHeight: lastCheckHeight,
      and: {
        toHeight: lastCheckHeight + config.app.heightSkipPerHeight
      },
      returnAsset: 1
    })

    if (!txs.success) {
      isLocked = false
      return
    }

    txs.transactions.forEach((tx) => {
      txsParser(prisma, notificationService, tx)
    })

    await prisma.cronJobStatus.update({
      where: { jobName: JobName.TRANSACTIONS },
      data: {
        state: JSON.stringify({
          lastHeight: lastCheckHeight + config.app.heightSkipPerHeight
        })
      }
    })

    isLocked = false
  })
}
