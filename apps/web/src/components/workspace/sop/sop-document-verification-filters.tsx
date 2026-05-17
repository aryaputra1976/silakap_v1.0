import { Field, inputClass } from '@/components/workspace/ui';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

export interface SopDocumentVerificationFilterValue {
  q: string;
  year: string;
  month: string;
  quarter: string;
  category: DmsDocumentCategory | '';
  status: DmsDocumentStatus | '';
  unitKerjaId: string;
  asnId: string;
}

export function SopDocumentVerificationFilters({
  value,
  disabled,
  onChange,
}: {
  value: SopDocumentVerificationFilterValue;
  disabled?: boolean;
  onChange: (value: SopDocumentVerificationFilterValue) => void;
}) {
  function update<K extends keyof SopDocumentVerificationFilterValue>(
    key: K,
    nextValue: SopDocumentVerificationFilterValue[K],
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Cari Dokumen / ASN / NIP">
          <input
            className={inputClass}
            disabled={disabled}
            placeholder="Cari judul dokumen, nama ASN, NIP, atau kata kunci"
            value={value.q}
            onChange={(event) => update('q', event.target.value)}
          />
        </Field>

        <Field label="Unit Kerja ID">
          <input
            className={inputClass}
            disabled={disabled}
            placeholder="Opsional UUID unit kerja"
            value={value.unitKerjaId}
            onChange={(event) => update('unitKerjaId', event.target.value)}
          />
        </Field>

        <Field label="ASN ID">
          <input
            className={inputClass}
            disabled={disabled}
            placeholder="Opsional UUID ASN"
            value={value.asnId}
            onChange={(event) => update('asnId', event.target.value)}
          />
        </Field>
      </div>

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

        <Field label="Kategori DMS">
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

        <Field label="Status DMS">
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
    </div>
  );
}
