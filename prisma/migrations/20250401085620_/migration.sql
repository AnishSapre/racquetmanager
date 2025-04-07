/*
  Warnings:

  - Added the required column `firstServer` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingSide` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Game` ADD COLUMN `currentSet` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `firstServer` INTEGER NOT NULL,
    ADD COLUMN `gameEnded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `scoreA` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `scoreB` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `setScoresA` JSON NOT NULL,
    ADD COLUMN `setScoresB` JSON NOT NULL,
    ADD COLUMN `startingSide` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Point` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `scoredBy` VARCHAR(191) NOT NULL,
    `scoreA` INTEGER NOT NULL,
    `scoreB` INTEGER NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Point` ADD CONSTRAINT `Point_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
