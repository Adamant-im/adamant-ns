import { Prisma } from '@prisma/client';

const notification = Prisma.validator<Prisma.NotificationsDefaultArgs>()({
  include: { device: true }
});

export type NotificationPayload = Prisma.NotificationsGetPayload<
  typeof notification
>;
