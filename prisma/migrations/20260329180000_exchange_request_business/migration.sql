SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `operator_logs`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `dispute_attachments`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `orders`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `exchange_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `type` ENUM('NEED_RUB', 'NEED_CFA') NOT NULL,
    `amountWanted` BIGINT NOT NULL,
    `currencyWanted` VARCHAR(191) NOT NULL,
    `amountToSend` BIGINT NOT NULL,
    `currencyToSend` VARCHAR(191) NOT NULL,
    `rateAtRequest` DECIMAL(10, 6) NOT NULL,
    `commissionAmount` BIGINT NOT NULL,
    `paymentMethod` ENUM('ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER', 'SBP', 'OTHER') NOT NULL,
    `phoneToSend` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `operatorId` INTEGER NOT NULL,
    `amountCfa` BIGINT NOT NULL,
    `amountRub` BIGINT NOT NULL,
    `rate` DECIMAL(10, 6) NOT NULL,
    `commissionAmount` BIGINT NOT NULL,
    `status` ENUM('INITIATED', 'CLIENT_SENT', 'OPERATOR_VERIFIED', 'OPERATOR_SENT', 'COMPLETED', 'DISPUTED', 'CANCELLED') NOT NULL DEFAULT 'INITIATED',
    `clientProofUrl` VARCHAR(191) NULL,
    `operatorProofUrl` VARCHAR(191) NULL,
    `operatorPaymentNumber` VARCHAR(191) NULL,
    `clientReceiveNumber` VARCHAR(191) NULL,
    `operatorNote` VARCHAR(191) NULL,
    `takenAt` DATETIME(3) NULL,
    `clientSentAt` DATETIME(3) NULL,
    `operatorSentAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_requestId_key`(`requestId`),
    INDEX `transactions_operatorId_idx`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'IMAGE') NOT NULL DEFAULT 'TEXT',
    `attachmentUrl` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `reviewerId` INTEGER NOT NULL,
    `reviewedId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `disputes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `openedBy` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'RESPONDED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `adminId` INTEGER NULL,
    `resolution` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `disputes_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dispute_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `disputeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `exchange_requests` ADD CONSTRAINT `exchange_requests_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `transactions` ADD CONSTRAINT `transactions_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `exchange_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `transactions` ADD CONSTRAINT `transactions_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transactions` ADD CONSTRAINT `transactions_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `operator_logs` ADD CONSTRAINT `operator_logs_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `operator_logs` ADD CONSTRAINT `operator_logs_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `messages` ADD CONSTRAINT `messages_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewedId_fkey` FOREIGN KEY (`reviewedId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `disputes` ADD CONSTRAINT `disputes_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `disputes` ADD CONSTRAINT `disputes_openedBy_fkey` FOREIGN KEY (`openedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `dispute_attachments` ADD CONSTRAINT `dispute_attachments_disputeId_fkey` FOREIGN KEY (`disputeId`) REFERENCES `disputes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
