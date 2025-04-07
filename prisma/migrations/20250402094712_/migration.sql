-- AlterTable
ALTER TABLE `Game` ADD COLUMN `currentServerIndexA` INTEGER NULL,
    ADD COLUMN `currentServerIndexB` INTEGER NULL,
    ADD COLUMN `currentServingTeam` VARCHAR(191) NULL,
    ADD COLUMN `teamAPlayerInRightCourtIndex` INTEGER NULL,
    ADD COLUMN `teamBPlayerInRightCourtIndex` INTEGER NULL;
