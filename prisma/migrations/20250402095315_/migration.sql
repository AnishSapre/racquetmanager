/*
  Warnings:

  - You are about to drop the column `currentServerIndexA` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `currentServerIndexB` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `currentServingTeam` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `teamAPlayerInRightCourtIndex` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `teamBPlayerInRightCourtIndex` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Game` DROP COLUMN `currentServerIndexA`,
    DROP COLUMN `currentServerIndexB`,
    DROP COLUMN `currentServingTeam`,
    DROP COLUMN `teamAPlayerInRightCourtIndex`,
    DROP COLUMN `teamBPlayerInRightCourtIndex`;
