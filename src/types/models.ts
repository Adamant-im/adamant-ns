import { z } from 'zod';
import { $Enums } from '@prisma/client';

export import PushServiceProvider = $Enums.PushServiceProvider;

export const ZSignalMessagePayload = z.object({
  deviceId: z.string(),
  token: z.string(),
  provider: z.nativeEnum(PushServiceProvider),
  action: z.enum(['add', 'remove'])
});

export type TSignalMessagePayload = z.infer<typeof ZSignalMessagePayload>;
