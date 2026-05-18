ALTER TABLE `opd_submission_documents`
  ADD COLUMN `uploaded_by_role` VARCHAR(80) NULL,
  ADD COLUMN `original_file_name` VARCHAR(255) NULL,
  ADD COLUMN `mime_type` VARCHAR(120) NULL,
  ADD COLUMN `size_bytes` INTEGER NULL,
  ADD COLUMN `storage_key` VARCHAR(500) NULL;
