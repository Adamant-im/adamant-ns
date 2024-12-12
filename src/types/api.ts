import { z } from 'zod';
import { PushServiceProvider } from './enums.js';

export const ZSignalMessagePayload = z.object({
  deviceId: z.string(),
  token: z.string(),
  provider: z.nativeEnum(PushServiceProvider),
  action: z.enum(['add', 'remove'])
});

export type TSignalMessagePayload = z.infer<typeof ZSignalMessagePayload>;
