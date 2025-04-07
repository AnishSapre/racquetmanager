/*
  Warnings:

  - Added the required column `previousServer` to the `Point` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Point` ADD COLUMN `previousServer` INTEGER NOT NULL;
