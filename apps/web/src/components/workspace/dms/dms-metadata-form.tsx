import { Field, inputClass } from '@/components/workspace/ui';
import {
  DMS_DOCUMENT_CATEGORIES,
  dmsCategoryLabel,
  type DmsDocumentCategory,
} from '@/lib/api/dms';

export interface DmsMetadataFormValue {
  title: string;
  description: string;
  category: DmsDocumentCategory;
  periodYear: string;
  periodMonth: string;
  periodQuarter: string;
  unitKerjaId: string;
  asnId: string;
  caseId: string;
  worklogId: string;
}

export const initialDmsMetadataForm: DmsMetadataFormValue = {
  title: '',
  description: '',
  category: 'BUKTI_DUKUNG',
  periodYear: String(new Date().getFullYear()),
  periodMonth: '',
  periodQuarter: '',
  unitKerjaId: '',
  asnId: '',
  caseId: '',
  worklogId: '',
};

export function DmsMetadataForm({
  value,
  disabled,
  onChange,
}: {
  value: DmsMetadataFormValue;
  disabled?: boolean;
  onChange: (value: DmsMetadataFormValue) => void;
}) {
  function update<K extends keyof DmsMetadataFormValue>(
    key: K,
    nextValue: DmsMetadataFormValue[K],
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <div className="grid gap-4">
      <Field label="Judul Dokumen">
        <input
          className={inputClass}
          disabled={disabled}
          required
          value={value.title}
          onChange={(event) => update('title', event.target.value)}
          placeholder="Contoh: Laporan Rekonsiliasi Data ASN Januari 2026"
        />
      </Field>

      <Field label="Deskripsi">
        <textarea
          className={`${inputClass} min-h-28 py-2`}
          disabled={disabled}
          value={value.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="Keterangan singkat dokumen dan konteks bukti dukung."
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Kategori">
          <select
            className={inputClass}
            disabled={disabled}
            value={value.category}
            onChange={(event) =>
              update('category', event.target.value as DmsDocumentCategory)
            }
          >
            {DMS_DOCUMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {dmsCategoryLabel(category)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tahun">
          <input
            className={inputClass}
            disabled={disabled}
            inputMode="numeric"
            maxLength={4}
            value={value.periodYear}
            onChange={(event) => update('periodYear', event.target.value)}
            placeholder="2026"
          />
        </Field>

        <Field label="Bulan">
          <select
            className={inputClass}
            disabled={disabled}
            value={value.periodMonth}
            onChange={(event) => update('periodMonth', event.target.value)}
          >
            <option value="">Tidak spesifik</option>
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
            value={value.periodQuarter}
            onChange={(event) => update('periodQuarter', event.target.value)}
          >
            <option value="">Tidak spesifik</option>
            {[1, 2, 3, 4].map((quarter) => (
              <option key={quarter} value={String(quarter)}>
                Triwulan {quarter}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Unit Kerja ID Opsional">
          <input
            className={inputClass}
            disabled={disabled}
            value={value.unitKerjaId}
            onChange={(event) => update('unitKerjaId', event.target.value)}
            placeholder="UUID unit kerja jika diperlukan"
          />
        </Field>

        <Field label="ASN ID Opsional">
          <input
            className={inputClass}
            disabled={disabled}
            value={value.asnId}
            onChange={(event) => update('asnId', event.target.value)}
            placeholder="UUID ASN jika terkait pegawai"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Case SIAP ID Opsional">
          <input
            className={inputClass}
            disabled={disabled}
            value={value.caseId}
            onChange={(event) => update('caseId', event.target.value)}
            placeholder="UUID case SIAP"
          />
        </Field>

        <Field label="Worklog ID Opsional">
          <input
            className={inputClass}
            disabled={disabled}
            value={value.worklogId}
            onChange={(event) => update('worklogId', event.target.value)}
            placeholder="UUID buku kerja SIAP"
          />
        </Field>
      </div>
    </div>
  );
}

export function toDmsCreatePayload(value: DmsMetadataFormValue) {
  return {
    title: value.title.trim(),
    description: normalizeOptional(value.description),
    category: value.category,
    periodYear: normalizeNumber(value.periodYear),
    periodMonth: normalizeNumber(value.periodMonth),
    periodQuarter: normalizeNumber(value.periodQuarter),
    unitKerjaId: normalizeOptional(value.unitKerjaId),
    asnId: normalizeOptional(value.asnId),
    caseId: normalizeOptional(value.caseId),
    worklogId: normalizeOptional(value.worklogId),
  };
}

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizeNumber(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}