import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus, RefreshCw, X } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  EmptyState,
  ErrorAlert,
  Field,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';

const PERIOD_STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
  DRAFT: 'warning',
};

const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function periodLabel(p: ReconciliationPeriod): string {
  if (p.periodType === 'MONTHLY' && p.periodMonth) {
    return `${MONTH_NAMES[p.periodMonth] ?? p.periodMonth} ${p.periodYear}`;
  }
  if (p.periodType === 'QUARTERLY' && p.periodQuarter) {
    return `Triwulan ${p.periodQuarter} ${p.periodYear}`;
  }
  return p.title;
}

type CreateForm = {
  periodType: 'MONTHLY' | 'QUARTERLY';
  periodYear: string;
  periodMonth: string;
  periodQuarter: string;
  cutOffDate: string;
  notes: string;
};

const EMPTY_FORM: CreateForm = {
  periodType: 'MONTHLY',
  periodYear: String(new Date().getFullYear()),
  periodMonth: String(new Date().getMonth() + 1),
  periodQuarter: '1',
  cutOffDate: '',
  notes: '',
};

export function RekonsiliasiBpkadPeriodePage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await reconciliationBpkadApi.fetchPeriods();
      setPeriods(list);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat periode.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.periodYear) { setFormError('Tahun wajib diisi.'); return; }
    if (form.periodType === 'MONTHLY' && !form.periodMonth) { setFormError('Bulan wajib diisi.'); return; }
    if (form.periodType === 'QUARTERLY' && !form.periodQuarter) { setFormError('Triwulan wajib diisi.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const label = form.periodType === 'MONTHLY'
        ? `Rekonsiliasi ${MONTH_NAMES[Number(form.periodMonth)] ?? form.periodMonth} ${form.periodYear}`
        : `Rekonsiliasi Triwulan ${form.periodQuarter} ${form.periodYear}`;
      await reconciliationBpkadApi.createPeriod({
        periodType: form.periodType,
        periodYear: form.periodYear,
        periodMonth: form.periodType === 'MONTHLY' ? form.periodMonth : undefined,
        periodQuarter: form.periodType === 'QUARTERLY' ? form.periodQuarter : undefined,
        title: label,
        cutOffDate: form.cutOffDate || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Gagal membuat periode.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Periode Rekonsiliasi"
        description="Buat dan kelola periode rekonsiliasi BKPSDM-BPKAD. Setiap siklus rekonsiliasi (bulanan/triwulanan) memerlukan periode tersendiri."
        actions={
          <div className="flex gap-2">
            <ActionButton icon={RefreshCw} variant="secondary" onClick={load} disabled={loading}>
              Refresh
            </ActionButton>
            <ActionButton icon={Plus} onClick={() => { setShowForm(true); setFormError(''); }}>
              Buat Periode
            </ActionButton>
          </div>
        }
      />

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <SectionCard
          title="Buat Periode Baru"
          description="Periode akan langsung aktif dan dapat digunakan untuk matching dan pengelolaan temuan."
        >
          <div className="space-y-4 max-w-lg">
            {formError && <ErrorAlert message={formError} />}

            <Field label="Jenis Periode">
              <select
                className={inputClass}
                value={form.periodType}
                onChange={(e) => setForm((f) => ({ ...f, periodType: e.target.value as 'MONTHLY' | 'QUARTERLY' }))}
              >
                <option value="MONTHLY">Bulanan</option>
                <option value="QUARTERLY">Triwulanan</option>
              </select>
            </Field>

            <Field label="Tahun">
              <input
                type="number"
                className={inputClass}
                placeholder="2026"
                min="2020"
                max="2050"
                value={form.periodYear}
                onChange={(e) => setForm((f) => ({ ...f, periodYear: e.target.value }))}
              />
            </Field>

            {form.periodType === 'MONTHLY' && (
              <Field label="Bulan">
                <select
                  className={inputClass}
                  value={form.periodMonth}
                  onChange={(e) => setForm((f) => ({ ...f, periodMonth: e.target.value }))}
                >
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <option key={i + 1} value={String(i + 1)}>{name}</option>
                  ))}
                </select>
              </Field>
            )}

            {form.periodType === 'QUARTERLY' && (
              <Field label="Triwulan">
                <select
                  className={inputClass}
                  value={form.periodQuarter}
                  onChange={(e) => setForm((f) => ({ ...f, periodQuarter: e.target.value }))}
                >
                  <option value="1">Triwulan I (Jan–Mar)</option>
                  <option value="2">Triwulan II (Apr–Jun)</option>
                  <option value="3">Triwulan III (Jul–Sep)</option>
                  <option value="4">Triwulan IV (Okt–Des)</option>
                </select>
              </Field>
            )}

            <Field label="Cut-off Date (opsional)" description="Tanggal data BPKAD diambil sebagai acuan.">
              <input
                type="date"
                className={inputClass}
                value={form.cutOffDate}
                onChange={(e) => setForm((f) => ({ ...f, cutOffDate: e.target.value }))}
              />
            </Field>

            <Field label="Catatan (opsional)">
              <textarea
                className={`${inputClass} min-h-[64px]`}
                placeholder="Catatan tambahan untuk periode ini..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>

            <div className="flex gap-3">
              <ActionButton icon={Plus} onClick={handleCreate} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Periode'}
              </ActionButton>
              <ActionButton
                icon={X}
                variant="secondary"
                onClick={() => { setShowForm(false); setFormError(''); }}
                disabled={saving}
              >
                Batal
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      )}

      {loading ? (
        <LoadingState message="Memuat daftar periode..." />
      ) : periods.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada periode"
          description="Buat periode pertama untuk memulai rekonsiliasi BKPSDM-BPKAD."
        />
      ) : (
        <SectionCard title={`Daftar Periode (${periods.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Judul</th>
                  <th className="pb-2 pr-4 font-medium">Jenis</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Cut-off</th>
                  <th className="pb-2 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{p.title}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {p.periodType === 'MONTHLY' ? `Bulanan · ${periodLabel(p)}` : `Triwulanan · ${periodLabel(p)}`}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge tone={PERIOD_STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</StatusBadge>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {p.cutOffDate ? formatDate(p.cutOffDate) : '—'}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
