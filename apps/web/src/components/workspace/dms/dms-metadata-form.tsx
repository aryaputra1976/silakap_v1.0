import { Shield } from 'lucide-react';
import { Field, inputClass } from '@/components/workspace/ui';
import {
  DMS_ACCESS_LEVELS,
  DMS_DOCUMENT_CATEGORIES,
  DMS_SUB_CATEGORIES,
  dmsAccessLevelDescription,
  dmsAccessLevelLabel,
  dmsAccessLevelTone,
  dmsCategoryLabel,
  dmsSubCategoryLabel,
  getDefaultAccessLevelForSubCategory,
  type DmsAccessLevel,
  type DmsDocumentCategory,
} from '@/lib/api/dms';
import {
  getSopDmsMappingByCode,
  isSopSubCategory,
  SOP_DMS_MAPPINGS,
  sopAccessLevelToDms,
} from '@/lib/dms/sop-taxonomy';

export interface DmsMetadataFormValue {
  title: string;
  description: string;
  category: DmsDocumentCategory;
  subCategory: string;
  /** Kode SOP jika dokumen adalah referensi SOP (opsional) */
  sopCode: string;
  tags: string;
  accessLevel: DmsAccessLevel;
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
  subCategory: '',
  sopCode: '',
  tags: '',
  accessLevel: 'INTERNAL',
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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

        <Field label="Subkategori">
          <select
            className={inputClass}
            disabled={disabled}
            value={value.subCategory}
            onChange={(event) => {
              const next = event.target.value;
              const suggestedLevel = next
                ? getDefaultAccessLevelForSubCategory(next)
                : 'INTERNAL';
              onChange({
                ...value,
                subCategory: next,
                sopCode: isSopSubCategory(next) ? value.sopCode : '',
                accessLevel: suggestedLevel,
              });
            }}
          >
            <option value="">Tidak spesifik</option>
            {DMS_SUB_CATEGORIES.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {dmsSubCategoryLabel(subCategory)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Level Akses">
          <select
            className={inputClass}
            disabled={disabled}
            value={value.accessLevel}
            onChange={(event) =>
              update('accessLevel', event.target.value as DmsAccessLevel)
            }
          >
            {DMS_ACCESS_LEVELS.map((accessLevel) => (
              <option key={accessLevel} value={accessLevel}>
                {dmsAccessLevelLabel(accessLevel)}
              </option>
            ))}
          </select>
          {value.accessLevel && (
            <div
              className={`mt-1.5 flex items-start gap-1.5 rounded border px-2 py-1.5 text-xs ${
                dmsAccessLevelTone(value.accessLevel) === 'danger'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : dmsAccessLevelTone(value.accessLevel) === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : dmsAccessLevelTone(value.accessLevel) === 'info'
                      ? 'border-[#9fd6dc] bg-[#e7f6f5] text-[#096672]'
                      : dmsAccessLevelTone(value.accessLevel) === 'dark'
                        ? 'border-[#103f3b] bg-[#1e4620] text-white'
                        : 'border-[#d6e2d1] bg-[#f4f8ef] text-[#51614c]'
              }`}
            >
              <Shield className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{dmsAccessLevelDescription(value.accessLevel)}</span>
            </div>
          )}
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

      {isSopSubCategory(value.subCategory) ? (
        <SopCodeField
          disabled={disabled}
          subCategory={value.subCategory}
          sopCode={value.sopCode}
          onSopCodeChange={(nextCode) => {
            const mapping = getSopDmsMappingByCode(nextCode);
            if (mapping) {
              const autoTags = [
                nextCode,
                ...mapping.tags,
              ]
                .filter((t, i, arr) => t && arr.indexOf(t) === i)
                .join(', ');
              onChange({
                ...value,
                sopCode: nextCode,
                tags: autoTags,
                accessLevel: sopAccessLevelToDms(mapping.accessLevel),
                description: value.description || mapping.description || '',
              });
            } else {
              onChange({ ...value, sopCode: nextCode });
            }
          }}
        />
      ) : null}

      <Field label="Tags">
        <input
          className={inputClass}
          disabled={disabled}
          value={value.tags}
          onChange={(event) => update('tags', event.target.value)}
          placeholder="Pisahkan dengan koma, contoh: SOP, RHK 3, Pensiun"
        />
      </Field>

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
  const baseTags = normalizeTags(value.tags) ?? [];
  const tagsWithSopCode =
    value.sopCode && !baseTags.includes(value.sopCode)
      ? [value.sopCode, ...baseTags]
      : baseTags;

  return {
    title: value.title.trim(),
    description: normalizeOptional(value.description),
    category: value.category,
    subCategory: normalizeOptional(value.subCategory),
    tags: tagsWithSopCode.length > 0 ? tagsWithSopCode : undefined,
    accessLevel: value.accessLevel,
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

function normalizeTags(value: string) {
  const tags = value
    .split(',')
    .map((item) => item.trim())
    .filter((item, index, items) => item && items.indexOf(item) === index);

  return tags.length > 0 ? tags : undefined;
}

function SopCodeField({
  disabled,
  subCategory,
  sopCode,
  onSopCodeChange,
}: {
  disabled?: boolean;
  subCategory: string;
  sopCode: string;
  onSopCodeChange: (code: string) => void;
}) {
  const options = SOP_DMS_MAPPINGS.filter(
    (item) => item.dmsSubCategory === subCategory,
  );

  if (options.length === 0) {
    return (
      <Field label="Kode SOP">
        <input
          className={inputClass}
          disabled={disabled}
          value={sopCode}
          onChange={(event) => onSopCodeChange(event.target.value)}
          placeholder="Contoh: SOP-BKPSDM-MAN-001"
        />
      </Field>
    );
  }

  return (
    <Field label="Kode SOP">
      <select
        className={inputClass}
        disabled={disabled}
        value={sopCode}
        onChange={(event) => onSopCodeChange(event.target.value)}
      >
        <option value="">Pilih SOP (opsional)</option>
        {options.map((item) => (
          <option key={item.sopCode} value={item.sopCode}>
            {item.sopCode} — {item.title}
          </option>
        ))}
      </select>
      {sopCode && getSopDmsMappingByCode(sopCode) ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {getSopDmsMappingByCode(sopCode)?.description}
        </p>
      ) : null}
    </Field>
  );
}
