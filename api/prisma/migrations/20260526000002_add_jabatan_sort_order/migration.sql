ALTER TABLE `siformen_jabatan`
  ADD COLUMN `sort_order` INT NULL;

CREATE INDEX `siformen_jabatan_sort_order_idx` ON `siformen_jabatan`(`sort_order`);
