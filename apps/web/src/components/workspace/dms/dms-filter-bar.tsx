import { RefreshCcw, Search, X } from 'lucide-react';
import {
  ActionButton,
  Field,
  inputClass,
  Toolbar,
} from '@/components/workspace/ui';
import {
  DMS_ACCESS_LEVELS,
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  DMS_SUB_CATEGORIES,
  dmsAccessLevelLabel,
  dmsCategoryLabel,
  dmsStatusLabel,
  dmsSubCategoryLabel,
  type DmsAccessLevel,
  type DmsDocumentCategory,
  type DmsDocumentListQuery,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

export type DmsFilterValue = Pick<
  DmsDocumentListQuery,
  'q' | 'category' | 'subCategory' | 'accessLevel' | 'status' | 'year' | 'month'
>;

export function DmsFilterBar({
  value,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  value: DmsFilterValue;
  loading?: boolean;
  onChange: (value: DmsFilterValue) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  function update<K extends keyof DmsFilterValue>(
    key: K,
    nextValue: DmsFilterValue[K],
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <Toolbar>
      <div className="grid w-full gap-3 lg:grid-cols-4 xl:grid-cols-[1.4fr_1fr_1fr_0.95fr_0.9fr_0.7fr_0.7fr_auto]">
        <Field label="Pencarian">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={`${inputClass} w-full pl-9`}
              placeholder="Cari judul, file, ASN, unit, case"
              value={value.q ?? ''}
              onChange={(event) => update('q', event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onApply();
                }
              }}
            />
          </div>
        </Field>

        <Field label="Kategori">
          <select
            className={`${inputClass} w-full`}
            value={value.category ?? ''}
            onChange={(event) =>
              update('category', event.target.value as DmsDocumentCategory | '')
            }
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
            className={`${inputClass} w-full`}
            value={value.status ?? ''}
            onChange={(event) =>
              update('status', event.target.value as DmsDocumentStatus | '')
            }
          >
            <option value="">Semua status</option>
            {DMS_DOCUMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {dmsStatusLabel(status)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subkategori">
          <select
            className={`${inputClass} w-full`}
            value={value.subCategory ?? ''}
            onChange={(event) => update('subCategory', event.target.value)}
          >
            <option value="">Semua subkategori</option>
            {DMS_SUB_CATEGORIES.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {dmsSubCategoryLabel(subCategory)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Akses">
          <select
            className={`${inputClass} w-full`}
            value={value.accessLevel ?? ''}
            onChange={(event) =>
              update('accessLevel', event.target.value as DmsAccessLevel | '')
            }
          >
            <option value="">Semua akses</option>
            {DMS_ACCESS_LEVELS.map((accessLevel) => (
              <option key={accessLevel} value={accessLevel}>
                {dmsAccessLevelLabel(accessLevel)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tahun">
          <input
            className={`${inputClass} w-full`}
            inputMode="numeric"
            maxLength={4}
            placeholder="2026"
            value={value.year ?? ''}
            onChange={(event) => update('year', event.target.value)}
          />
        </Field>

        <Field label="Bulan">
          <select
            className={`${inputClass} w-full`}
            value={value.month ?? ''}
            onChange={(event) => update('month', event.target.value)}
          >
            <option value="">Semua</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={String(month)}>
                {month}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-end gap-2">
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={onApply}
            variant="secondary"
          >
            Terapkan
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={X}
            onClick={onReset}
            variant="ghost"
          >
            Reset
          </ActionButton>
        </div>
      </div>
    </Toolbar>
  );
}
