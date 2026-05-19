import { useEffect, useState } from 'react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  Field,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ikmApi } from '@/lib/api/ikm';
import type { IkmSurveyPeriod } from '@/lib/ikm/types';

export function IkmPeriodePage() {
  const [periods, setPeriods] = useState<IkmSurveyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [semester, setSemester] = useState('1');
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function load() {
    setLoading(true);
    ikmApi
      .fetchPeriods()
      .then((res) => { if (res.success) setPeriods(res.data); })
      .catch(() => setError('Gagal memuat periode IKM'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await ikmApi.createPeriod({
        year: parseInt(year, 10),
        semester: parseInt(semester, 10),
        label: label.trim() || `Semester ${semester} Tahun ${year}`,
      });
      if (res.success) {
        setShowCreate(false);
        setLabel('');
        load();
      }
    } catch (err: unknown) {
      setCreateError((err as { message?: string })?.message ?? 'Gagal membuat periode');
    } finally {
      setCreating(false);
    }
  }

  async function handleClose(id: string) {
    try {
      await ikmApi.closePeriod(id);
      load();
    } catch {
      alert('Gagal menutup periode');
    }
  }

  async function handleReopen(id: string) {
    try {
      await ikmApi.reopenPeriod(id);
      load();
    } catch {
      alert('Gagal membuka periode');
    }
  }

  const columns = [
    {
      key: 'label',
      header: 'Label Periode',
      render: (p: IkmSurveyPeriod) => <span className="font-medium">{p.label}</span>,
    },
    {
      key: 'semester',
      header: 'Semester / Tahun',
      render: (p: IkmSurveyPeriod) => `Semester ${p.semester} / ${p.year}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: IkmSurveyPeriod) => (
        <StatusBadge value={p.status} tone={p.status === 'OPEN' ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (p: IkmSurveyPeriod) =>
        p.status === 'OPEN' ? (
          <ActionButton variant="secondary" onClick={() => handleClose(p.id)}>
            Tutup
          </ActionButton>
        ) : (
          <ActionButton variant="secondary" onClick={() => handleReopen(p.id)}>
            Buka Kembali
          </ActionButton>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Periode IKM"
        description="Kelola periode survei kepuasan layanan (IKM) semesteran."
        meta={<StatusBadge value="IKM" tone="info" />}
      />

      <SectionCard
        title="Daftar Periode Survei"
        action={
          <ActionButton variant="primary" onClick={() => setShowCreate(!showCreate)}>
            + Buat Periode
          </ActionButton>
        }
      >
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
            <p className="text-sm font-semibold text-blue-800">Buat Periode Baru</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tahun">
                <input
                  type="number"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  value={year}
                  min={2020}
                  max={2099}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </Field>
              <Field label="Semester">
                <select
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1">Semester 1 (Jan–Jun)</option>
                  <option value="2">Semester 2 (Jul–Des)</option>
                </select>
              </Field>
              <Field label="Label (opsional)">
                <input
                  type="text"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  placeholder={`Semester ${semester} Tahun ${year}`}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </Field>
            </div>
            {createError && <ErrorAlert message={createError} />}
            <div className="flex gap-2">
              <ActionButton type="submit" variant="primary" disabled={creating}>
                {creating ? 'Menyimpan...' : 'Simpan'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setShowCreate(false)}>
                Batal
              </ActionButton>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingState message="Memuat periode..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <DataTable
            data={periods}
            keyField="id"
            columns={columns}
            empty="Belum ada periode IKM"
          />
        )}
      </SectionCard>
    </div>
  );
}
