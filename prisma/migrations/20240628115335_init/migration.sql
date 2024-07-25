-- CreateEnum
CREATE TYPE "PushServiceProvider" AS ENUM ('FCM', 'APNS');

-- CreateEnum
CREATE TYPE "JobName" AS ENUM ('TRANSACTIONS');

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admAddress" VARCHAR(18) NOT NULL,
    "pushToken" TEXT NOT NULL,
    "pushServiceProvider" "PushServiceProvider" NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifyTransaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admTxId" VARCHAR(20) NOT NULL,
    "admTxDate" TIMESTAMP(3) NOT NULL,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "lastNotifyDate" TIMESTAMP(3),
    "deviceId" INTEGER NOT NULL,

    CONSTRAINT "NotifyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronJobStatus" (
    "id" SERIAL NOT NULL,
    "jobName" "JobName" NOT NULL,
    "state" JSONB NOT NULL,

    CONSTRAINT "CronJobStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_admAddress_idx" ON "Device"("admAddress");

-- AddForeignKey
ALTER TABLE "NotifyTransaction" ADD CONSTRAINT "NotifyTransaction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
