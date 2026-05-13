import { RefreshCcw } from 'lucide-react';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';
import {
  ActionButton,
  Field,
  inputClass,
  Toolbar,
} from '@/components/workspace/ui';

export type ReportFilter = {
  year: string;
  month: string;
  quarter: string;
  category: DmsDocumentCategory | '';
  status: DmsDocumentStatus | '';
};

export const defaultFilter: ReportFilter = {
  year: String(new Date().getFullYear()),
  month: '',
  quarter: '',
  category: '',
  status: '',
};

type DmsReportsFilterSectionProps = {
  filter: ReportFilter;
  loading: boolean;
  onFilterChange: (value: ReportFilter) => void;
  onApply: () => void;
  onReset: () => void;
};

export function DmsReportsFilterSection({
  filter,
  loading,
  onFilterChange,
  onApply,
  onReset,
}: DmsReportsFilterSectionProps) {
  return (
    <Toolbar>
      <div className="grid w-full gap-3 md:grid-cols-5">
        <Field label="Tahun">
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={4}
            value={filter.year}
            onChange={(event) =>
              onFilterChange({ ...filter, year: event.target.value })
            }
            placeholder="2026"
          />
        </Field>

        <Field label="Bulan">
          <select
            className={inputClass}
            value={filter.month}
            onChange={(event) =>
              onFilterChange({ ...filter, month: event.target.value })
            }
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
            value={filter.quarter}
            onChange={(event) =>
              onFilterChange({ ...filter, quarter: event.target.value })
            }
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
            value={filter.category}
            onChange={(event) =>
              onFilterChange({
                ...filter,
                category: event.target.value as DmsDocumentCategory | '',
              })
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
            className={inputClass}
            value={filter.status}
            onChange={(event) =>
              onFilterChange({
                ...filter,
                status: event.target.value as DmsDocumentStatus | '',
              })
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
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <ActionButton
          disabled={loading}
          icon={RefreshCcw}
          onClick={onApply}
          variant="secondary"
        >
          Terapkan
        </ActionButton>
        <ActionButton disabled={loading} onClick={onReset} variant="ghost">
          Reset
        </ActionButton>
      </div>
    </Toolbar>
  );
}
