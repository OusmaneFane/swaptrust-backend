-- CreateTable
CREATE TABLE `platform_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `method` ENUM('ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER', 'SBP', 'OTHER') NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `grossAmount` BIGINT NULL,
    ADD COLUMN `netAmount` BIGINT NULL,
    ADD COLUMN `commissionPercent` DECIMAL(5, 2) NULL,
    ADD COLUMN `googleRate` DECIMAL(10, 6) NULL,
    ADD COLUMN `platformAccountId` INTEGER NULL,
    ADD COLUMN `platformToOperatorProofUrl` VARCHAR(191) NULL,
    ADD COLUMN `platformTransferredAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `transactions_platformAccountId_idx` ON `transactions`(`platformAccountId`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_platformAccountId_fkey` FOREIGN KEY (`platformAccountId`) REFERENCES `platform_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
