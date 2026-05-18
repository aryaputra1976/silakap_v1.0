-- CreateTable
CREATE TABLE `working_calendar` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Makassar',
    `work_days` JSON NOT NULL,
    `work_start` VARCHAR(5) NOT NULL DEFAULT '08:00',
    `work_end` VARCHAR(5) NOT NULL DEFAULT '16:00',
    `break_start` VARCHAR(5) NULL DEFAULT '12:00',
    `break_end` VARCHAR(5) NULL DEFAULT '13:00',
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `working_calendar_name_key`(`name`),
    INDEX `working_calendar_is_default_idx`(`is_default`),
    INDEX `working_calendar_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holiday_calendar` (
    `id` VARCHAR(36) NOT NULL,
    `working_calendar_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `is_recurring_yearly` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `holiday_calendar_working_calendar_id_idx`(`working_calendar_id`),
    INDEX `holiday_calendar_date_idx`(`date`),
    UNIQUE INDEX `holiday_calendar_working_calendar_id_date_key`(`working_calendar_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `holiday_calendar` ADD CONSTRAINT `holiday_calendar_working_calendar_id_fkey` FOREIGN KEY (`working_calendar_id`) REFERENCES `working_calendar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
