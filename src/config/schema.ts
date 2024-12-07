import { z } from 'zod';

export const schema = z
  .object({
    app: z.object({
      port: z.number()
    }),
    notificationExpiryHours: z.number(),
    admNodes: z.array(z.string()),
    passPhrase: z.string(),
    notifyTxTypes: z.array(z.number()),
    chatTxTypeIncludeSubtype: z.array(z.number()),
    latestHeightToNotify: z.number()
  })
  .strict(); /* Throw error on unknown properties. This will help users to migrate from the
 * older versions of the bot that use different config schema
 */

export type Schema = z.infer<typeof schema>;
