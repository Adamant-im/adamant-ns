/*
  Warnings:

  - The values [SEED_TOKENS] on the enum `JobName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobName_new" AS ENUM ('TRANSACTIONS');
ALTER TABLE "CronJobStatus" ALTER COLUMN "jobName" TYPE "JobName_new" USING ("jobName"::text::"JobName_new");
ALTER TYPE "JobName" RENAME TO "JobName_old";
ALTER TYPE "JobName_new" RENAME TO "JobName";
DROP TYPE "JobName_old";
COMMIT;
