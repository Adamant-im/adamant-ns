/*
  Warnings:

  - You are about to drop the `CronJobStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotifyTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('Pending', 'Delivered', 'Cancelled');

-- DropForeignKey
ALTER TABLE "NotifyTransaction" DROP CONSTRAINT "NotifyTransaction_deviceId_fkey";

-- DropTable
DROP TABLE "CronJobStatus";

-- DropTable
DROP TABLE "NotifyTransaction";

-- DropEnum
DROP TYPE "JobName";

-- CreateTable
CREATE TABLE "Notifications" (
    "id" SERIAL NOT NULL,
    "admTxId" TEXT NOT NULL,
    "admTxDate" TIMESTAMP(3) NOT NULL,
    "admTxType" INTEGER NOT NULL,
    "admTx" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notifications_admTxId_deviceId_key" ON "Notifications"("admTxId", "deviceId");

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
