import { Field, inputClass } from '@/components/workspace/ui';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

export interface SopEvidenceFilterValue {
  year: string;
  month: string;
  quarter: string;
  category: DmsDocumentCategory | '';
  status: DmsDocumentStatus | '';
}

export function SopEvidenceFilters({
  value,
  disabled,
  onChange,
}: {
  value: SopEvidenceFilterValue;
  disabled?: boolean;
  onChange: (value: SopEvidenceFilterValue) => void;
}) {
  function update<K extends keyof SopEvidenceFilterValue>(key: K, nextValue: SopEvidenceFilterValue[K]) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Field label="Tahun">
        <input
          className={inputClass}
          disabled={disabled}
          inputMode="numeric"
          maxLength={4}
          placeholder="2026"
          value={value.year}
          onChange={(event) => update('year', event.target.value)}
        />
      </Field>

      <Field label="Bulan">
        <select
          className={inputClass}
          disabled={disabled}
          value={value.month}
          onChange={(event) => update('month', event.target.value)}
        >
          <option value="">Semua bulan</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={String(month)}>
              {month}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Triwulan">
        <select
          className={inputClass}
          disabled={disabled}
          value={value.quarter}
          onChange={(event) => update('quarter', event.target.value)}
        >
          <option value="">Semua triwulan</option>
          {[1, 2, 3, 4].map((quarter) => (
            <option key={quarter} value={String(quarter)}>
              Triwulan {quarter}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kategori">
        <select
          className={inputClass}
          disabled={disabled}
          value={value.category}
          onChange={(event) => update('category', event.target.value as DmsDocumentCategory | '')}
        >
          <option value="">Semua kategori</option>
          {DMS_DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {dmsCategoryLabel(category)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status">
        <select
          className={inputClass}
          disabled={disabled}
          value={value.status}
          onChange={(event) => update('status', event.target.value as DmsDocumentStatus | '')}
        >
          <option value="">Semua status</option>
          {DMS_DOCUMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {dmsStatusLabel(status)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
