/*
  Warnings:

  - A unique constraint covering the columns `[jobName]` on the table `CronJobStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CronJobStatus_jobName_key" ON "CronJobStatus"("jobName");
