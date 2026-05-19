import { useEffect, useState } from 'react';
import {
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ikmApi } from '@/lib/api/ikm';
import { IKM_PREDIKAT_LABELS, IkmSurvey, IkmSurveyPeriod } from '@/lib/ikm/types';

export function IkmDataPage() {
  const [periods, setPeriods] = useState<IkmSurveyPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [surveys, setSurveys] = useState<IkmSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ikmApi.fetchPeriods().then((res) => {
      if (res.success && res.data.length > 0) {
        setPeriods(res.data);
        setSelectedPeriodId(res.data[0].id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setError('Gagal memuat daftar periode');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPeriodId) return;
    setLoading(true);
    ikmApi.fetchSurveys({ periodId: selectedPeriodId })
      .then((res) => { if (res.success) setSurveys(res.data); })
      .catch(() => setError('Gagal memuat data survei'))
      .finally(() => setLoading(false));
  }, [selectedPeriodId]);

  const columns = [
    {
      key: 'opdName',
      header: 'Nama OPD',
      render: (s: IkmSurvey) => <span className="font-medium">{s.opdName}</span>,
    },
    {
      key: 'serviceType',
      header: 'Jenis Layanan',
      render: (s: IkmSurvey) => s.serviceType ?? '—',
    },
    {
      key: 'ikmConvert',
      header: 'Nilai IKM',
      render: (s: IkmSurvey) =>
        s.ikmConvert != null ? (
          <span className="font-semibold">{s.ikmConvert.toFixed(2)}</span>
        ) : '—',
    },
    {
      key: 'predikat',
      header: 'Predikat',
      render: (s: IkmSurvey) =>
        s.predikat ? (
          <StatusBadge
            value={s.predikat}
            tone={
              s.predikat === 'A' ? 'success'
              : s.predikat === 'B' ? 'info'
              : s.predikat === 'C' ? 'warning'
              : 'danger'
            }
          />
        ) : '—',
    },
    {
      key: 'submittedAt',
      header: 'Tanggal Isi',
      render: (s: IkmSurvey) => new Date(s.submittedAt).toLocaleDateString('id-ID'),
    },
    {
      key: 'comments',
      header: 'Saran / Masukan',
      render: (s: IkmSurvey) =>
        s.comments ? (
          <span className="text-xs text-zinc-600" title={s.comments}>
            {s.comments.length > 60 ? s.comments.slice(0, 60) + '...' : s.comments}
          </span>
        ) : '—',
    },
  ];

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Survei IKM Masuk"
        description="Daftar pengisian survei kepuasan layanan dari seluruh OPD."
        meta={<StatusBadge value="IKM" tone="info" />}
      />

      <SectionCard title="Filter Periode">
        <div className="flex gap-3 items-center">
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.status})
              </option>
            ))}
          </select>
          {activePeriod && (
            <StatusBadge
              value={activePeriod.status}
              tone={activePeriod.status === 'OPEN' ? 'success' : 'neutral'}
            />
          )}
          <span className="text-sm text-zinc-500">{surveys.length} responden</span>
        </div>
      </SectionCard>

      <SectionCard title="Daftar Pengisian Survei">
        {loading ? (
          <LoadingState message="Memuat data survei..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <DataTable
            data={surveys}
            keyField="id"
            columns={columns}
            empty="Belum ada survei yang masuk untuk periode ini"
          />
        )}
      </SectionCard>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
        <span className="font-semibold">Keterangan predikat (PermenPANRB No. 14/2017):</span>{' '}
        {Object.entries(IKM_PREDIKAT_LABELS).map(([k, v]) => (
          <span key={k} className="mr-3"><span className="font-semibold text-zinc-700">{k}</span> = {v}</span>
        ))}
      </div>
    </div>
  );
}
