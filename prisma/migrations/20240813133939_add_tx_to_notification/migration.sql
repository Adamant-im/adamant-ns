/*
  Warnings:

  - Added the required column `admTx` to the `NotifyTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NotifyTransaction" ADD COLUMN     "admTx" JSONB NOT NULL;
