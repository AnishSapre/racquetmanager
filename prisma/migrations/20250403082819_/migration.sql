/*
  Warnings:

  - You are about to drop the column `previousServer` on the `Point` table. All the data in the column will be lost.
  - Added the required column `servingTeam` to the `Point` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Point` DROP COLUMN `previousServer`,
    ADD COLUMN `playerPositionsA` JSON NULL,
    ADD COLUMN `playerPositionsB` JSON NULL,
    ADD COLUMN `serverIndex` INTEGER NULL,
    ADD COLUMN `servingTeam` VARCHAR(191) NOT NULL;
