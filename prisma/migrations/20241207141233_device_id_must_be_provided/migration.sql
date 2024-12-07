/*
  Warnings:

  - The primary key for the `Device` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "NotifyTransaction" DROP CONSTRAINT "NotifyTransaction_deviceId_fkey";

-- DropIndex
DROP INDEX "Device_admAddress_idx";

-- DropIndex
DROP INDEX "Device_pushToken_key";

-- AlterTable
ALTER TABLE "Device" DROP CONSTRAINT "Device_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "admAddress" SET DATA TYPE TEXT,
ADD CONSTRAINT "Device_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Device_id_seq";

-- AlterTable
ALTER TABLE "NotifyTransaction" ALTER COLUMN "deviceId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "NotifyTransaction" ADD CONSTRAINT "NotifyTransaction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
