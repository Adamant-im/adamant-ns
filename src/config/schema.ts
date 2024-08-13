import { z } from 'zod'

export const schema = z
  .object({
    database: z.object({
      url: z.string()
    }),
    app: z.object({
      port: z.number()
    }),
    notificationExpiryHours: z.number(),
    admNodes: z.array(z.string()),
    passPhrase: z.string(),
    notifyTxTypes: z.array(z.number()),
    chatTxTypeIncludeSubtype: z.array(z.number()),
    notificationService: z.enum(['FCM', 'APNS'])
  })
  .strict() /* Throw error on unknown properties. This will help users to migrate from the
 * older versions of the bot that use different config schema
 */
