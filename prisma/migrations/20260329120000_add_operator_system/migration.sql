-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` ENUM('CLIENT', 'OPERATOR', 'ADMIN') NOT NULL DEFAULT 'CLIENT';

UPDATE `users` SET `role` = 'ADMIN' WHERE `isAdmin` = true;

ALTER TABLE `users` DROP COLUMN `isAdmin`;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `operatorId` INTEGER NULL,
    ADD COLUMN `operatorNote` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `operator_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `operatorId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operator_logs_transactionId_idx`(`transactionId`),
    INDEX `operator_logs_operatorId_idx`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operator_logs` ADD CONSTRAINT `operator_logs_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operator_logs` ADD CONSTRAINT `operator_logs_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `transactions_operatorId_idx` ON `transactions`(`operatorId`);
