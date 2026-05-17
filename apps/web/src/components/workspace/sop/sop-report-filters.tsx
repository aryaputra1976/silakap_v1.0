import { Field, inputClass } from '@/components/workspace/ui';
import type {
  SopReportFilter,
  SopReportPeriodType,
} from '@/lib/sop/sop-report-data';

export function SopReportFilters({
  value,
  onChange,
}: {
  value: SopReportFilter;
  onChange: (value: SopReportFilter) => void;
}) {
  function update<K extends keyof SopReportFilter>(
    key: K,
    nextValue: SopReportFilter[K],
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Field label="Tahun">
        <input
          className={inputClass}
          inputMode="numeric"
          maxLength={4}
          value={value.year}
          onChange={(event) => update('year', event.target.value)}
          placeholder="2026"
        />
      </Field>

      <Field label="Jenis Periode">
        <select
          className={inputClass}
          value={value.periodType}
          onChange={(event) =>
            update('periodType', event.target.value as SopReportPeriodType)
          }
        >
          <option value="TAHUNAN">Tahunan</option>
          <option value="TRIWULAN">Triwulan</option>
          <option value="BULANAN">Bulanan</option>
        </select>
      </Field>

      <Field label="Bulan">
        <select
          className={inputClass}
          disabled={value.periodType !== 'BULANAN'}
          value={value.month}
          onChange={(event) => update('month', event.target.value)}
        >
          <option value="">Pilih bulan</option>
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
          disabled={value.periodType !== 'TRIWULAN'}
          value={value.quarter}
          onChange={(event) => update('quarter', event.target.value)}
        >
          <option value="">Pilih triwulan</option>
          {[1, 2, 3, 4].map((quarter) => (
            <option key={quarter} value={String(quarter)}>
              Triwulan {quarter}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
