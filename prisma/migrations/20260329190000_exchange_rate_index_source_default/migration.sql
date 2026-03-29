-- AlterTable
ALTER TABLE `exchange_rates` MODIFY COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'google_finance';

-- CreateIndex
CREATE INDEX `exchange_rates_fromCurrency_toCurrency_fetchedAt_idx` ON `exchange_rates`(`fromCurrency`, `toCurrency`, `fetchedAt`);
