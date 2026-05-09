-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `user` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `nip` VARCHAR(30) NULL,
    `phone` VARCHAR(30) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `unit_kerja_id` VARCHAR(36) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_user_key`(`user`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_nip_key`(`nip`),
    INDEX `users_user_idx`(`user`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_nip_idx`(`nip`),
    INDEX `users_unit_kerja_id_idx`(`unit_kerja_id`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    INDEX `roles_code_idx`(`code`),
    INDEX `roles_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(120) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_resource_idx`(`resource`),
    INDEX `permissions_action_idx`(`action`),
    INDEX `permissions_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,

    INDEX `user_roles_user_id_idx`(`user_id`),
    INDEX `user_roles_role_id_idx`(`role_id`),
    UNIQUE INDEX `user_roles_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(36) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,

    INDEX `role_permissions_role_id_idx`(`role_id`),
    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    INDEX `refresh_tokens_revoked_at_idx`(`revoked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit_kerja` (
    `id` VARCHAR(36) NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `level` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `unit_kerja_kode_key`(`kode`),
    INDEX `unit_kerja_kode_idx`(`kode`),
    INDEX `unit_kerja_parent_id_idx`(`parent_id`),
    INDEX `unit_kerja_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asn` (
    `id` VARCHAR(36) NOT NULL,
    `nip` VARCHAR(30) NOT NULL,
    `nik` VARCHAR(30) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(30) NULL,
    `unit_kerja_id` VARCHAR(36) NULL,
    `jabatan_nama` VARCHAR(200) NULL,
    `golongan_nama` VARCHAR(100) NULL,
    `jenis_asn` VARCHAR(50) NULL,
    `status_asn` VARCHAR(50) NULL,
    `tanggal_lahir` DATETIME(3) NULL,
    `tmt_pensiun` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `asn_nip_key`(`nip`),
    UNIQUE INDEX `asn_nik_key`(`nik`),
    INDEX `asn_nip_idx`(`nip`),
    INDEX `asn_nama_idx`(`nama`),
    INDEX `asn_unit_kerja_id_idx`(`unit_kerja_id`),
    INDEX `asn_status_asn_idx`(`status_asn`),
    INDEX `asn_tmt_pensiun_idx`(`tmt_pensiun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siap_cases` (
    `id` VARCHAR(36) NOT NULL,
    `case_number` VARCHAR(80) NOT NULL,
    `service_type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `asn_id` VARCHAR(36) NULL,
    `current_state` VARCHAR(80) NOT NULL DEFAULT 'DRAFT',
    `status` ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `submitted_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `closed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `siap_cases_case_number_key`(`case_number`),
    INDEX `siap_cases_case_number_idx`(`case_number`),
    INDEX `siap_cases_service_type_idx`(`service_type`),
    INDEX `siap_cases_asn_id_idx`(`asn_id`),
    INDEX `siap_cases_current_state_idx`(`current_state`),
    INDEX `siap_cases_status_idx`(`status`),
    INDEX `siap_cases_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siap_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `case_id` VARCHAR(36) NOT NULL,
    `task_type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RETURNED', 'COMPLETED', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'CREATED',
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `assigned_to` VARCHAR(36) NULL,
    `assigned_by` VARCHAR(36) NULL,
    `due_date` DATETIME(3) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(36) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `siap_tasks_case_id_idx`(`case_id`),
    INDEX `siap_tasks_task_type_idx`(`task_type`),
    INDEX `siap_tasks_status_idx`(`status`),
    INDEX `siap_tasks_assigned_to_idx`(`assigned_to`),
    INDEX `siap_tasks_due_date_idx`(`due_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_definitions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `service_type` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workflow_definitions_code_key`(`code`),
    INDEX `workflow_definitions_code_idx`(`code`),
    INDEX `workflow_definitions_service_type_idx`(`service_type`),
    INDEX `workflow_definitions_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_transitions` (
    `id` VARCHAR(36) NOT NULL,
    `workflow_id` VARCHAR(36) NOT NULL,
    `from_state` VARCHAR(80) NOT NULL,
    `to_state` VARCHAR(80) NOT NULL,
    `action_code` VARCHAR(80) NOT NULL,
    `allowed_role` VARCHAR(80) NOT NULL,
    `sla_days` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `workflow_transitions_workflow_id_idx`(`workflow_id`),
    INDEX `workflow_transitions_from_state_idx`(`from_state`),
    INDEX `workflow_transitions_to_state_idx`(`to_state`),
    INDEX `workflow_transitions_action_code_idx`(`action_code`),
    INDEX `workflow_transitions_allowed_role_idx`(`allowed_role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_logs` (
    `id` VARCHAR(36) NOT NULL,
    `case_id` VARCHAR(36) NOT NULL,
    `from_state` VARCHAR(80) NULL,
    `to_state` VARCHAR(80) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `note` TEXT NULL,
    `performed_by` VARCHAR(36) NULL,
    `performed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,

    INDEX `workflow_logs_case_id_idx`(`case_id`),
    INDEX `workflow_logs_performed_by_idx`(`performed_by`),
    INDEX `workflow_logs_action_idx`(`action`),
    INDEX `workflow_logs_performed_at_idx`(`performed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_tracking` (
    `id` VARCHAR(36) NOT NULL,
    `case_id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NULL,
    `workflow_state` VARCHAR(80) NOT NULL,
    `started_at` DATETIME(3) NOT NULL,
    `due_at` DATETIME(3) NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `status` ENUM('ON_TRACK', 'WARNING', 'OVERDUE', 'ESCALATED', 'COMPLETED') NOT NULL DEFAULT 'ON_TRACK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sla_tracking_case_id_idx`(`case_id`),
    INDEX `sla_tracking_task_id_idx`(`task_id`),
    INDEX `sla_tracking_workflow_state_idx`(`workflow_state`),
    INDEX `sla_tracking_due_at_idx`(`due_at`),
    INDEX `sla_tracking_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(36) NOT NULL,
    `case_id` VARCHAR(36) NULL,
    `document_type` VARCHAR(100) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `original_file_name` VARCHAR(255) NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(120) NULL,
    `file_size` INTEGER NULL,
    `checksum` VARCHAR(128) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `uploaded_by` VARCHAR(36) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `documents_case_id_idx`(`case_id`),
    INDEX `documents_document_type_idx`(`document_type`),
    INDEX `documents_uploaded_by_idx`(`uploaded_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_entries` (
    `id` VARCHAR(36) NOT NULL,
    `case_id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `performed_by` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timeline_entries_case_id_idx`(`case_id`),
    INDEX `timeline_entries_task_id_idx`(`task_id`),
    INDEX `timeline_entries_performed_by_idx`(`performed_by`),
    INDEX `timeline_entries_event_type_idx`(`event_type`),
    INDEX `timeline_entries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `performed_by` VARCHAR(36) NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_idx`(`entity_type`),
    INDEX `audit_logs_entity_id_idx`(`entity_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_performed_by_idx`(`performed_by`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_events` (
    `id` VARCHAR(36) NOT NULL,
    `event_type` VARCHAR(120) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NOT NULL,
    `payload` JSON NULL,
    `status` ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    INDEX `domain_events_event_type_idx`(`event_type`),
    INDEX `domain_events_entity_type_idx`(`entity_type`),
    INDEX `domain_events_entity_id_idx`(`entity_id`),
    INDEX `domain_events_status_idx`(`status`),
    INDEX `domain_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_unit_kerja_id_fkey` FOREIGN KEY (`unit_kerja_id`) REFERENCES `unit_kerja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_kerja` ADD CONSTRAINT `unit_kerja_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `unit_kerja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asn` ADD CONSTRAINT `asn_unit_kerja_id_fkey` FOREIGN KEY (`unit_kerja_id`) REFERENCES `unit_kerja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siap_cases` ADD CONSTRAINT `siap_cases_asn_id_fkey` FOREIGN KEY (`asn_id`) REFERENCES `asn`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siap_tasks` ADD CONSTRAINT `siap_tasks_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `siap_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siap_tasks` ADD CONSTRAINT `siap_tasks_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `siap_tasks` ADD CONSTRAINT `siap_tasks_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_transitions` ADD CONSTRAINT `workflow_transitions_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflow_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_logs` ADD CONSTRAINT `workflow_logs_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `siap_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_logs` ADD CONSTRAINT `workflow_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_tracking` ADD CONSTRAINT `sla_tracking_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `siap_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_tracking` ADD CONSTRAINT `sla_tracking_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `siap_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `siap_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `siap_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `siap_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_entries` ADD CONSTRAINT `timeline_entries_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_performed_by_fkey` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
