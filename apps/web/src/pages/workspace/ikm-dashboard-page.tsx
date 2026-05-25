import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { ikmApi } from '@/lib/api/ikm';
import {
  IKM_PREDIKAT_LABELS,
  IKM_UNSUR_LABELS,
  IkmSummary,
  IkmSurveyPeriod,
  IkmTrendEntry,
} from '@/lib/ikm/types';

const PREDIKAT_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#d97706',
  D: '#dc2626',
};

function predikatTone(p: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  if (p === 'A') return 'success';
  if (p === 'B') return 'info';
  if (p === 'C') return 'warning';
  if (p === 'D') return 'danger';
  return 'neutral';
}

export function IkmDashboardPage() {
  const [periods, setPeriods] = useState<IkmSurveyPeriod[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState<IkmSummary | null>(null);
  const [trend, setTrend] = useState<IkmTrendEntry[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([ikmApi.fetchPeriods(), ikmApi.getTrend()])
      .then(([periodsRes, trendRes]) => {
        if (periodsRes.success && periodsRes.data.length > 0) {
          setPeriods(periodsRes.data);
          setSelectedId(periodsRes.data[0].id);
        }
        if (trendRes.success) setTrend(trendRes.data);
      })
      .catch(() => setError('Gagal memuat data IKM'))
      .finally(() => setLoadingInit(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingSummary(true);
    setSummary(null);
    ikmApi
      .getSummary(selectedId)
      .then((res) => {
        if (res.success) setSummary(res.data);
      })
      .catch(() => setError('Gagal memuat ringkasan periode'))
      .finally(() => setLoadingSummary(false));
  }, [selectedId]);

  const activePeriod = periods.find((p) => p.id === selectedId);

  const unsurData = Object.entries(IKM_UNSUR_LABELS).map(([key, label]) => ({
    key,
    shortLabel: label.split(',')[0].split('/')[0].trim().slice(0, 22),
    value: summary ? Math.round((summary.avgPerUnsur[key] ?? 0) * 100) / 100 : 0,
  }));

  const predikatData = summary
    ? Object.entries(summary.predikatDistribution)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v, color: PREDIKAT_COLORS[k] ?? '#94a3b8' }))
    : [];

  const trendChartData = trend.map((t) => ({
    label: `S${t.semester}/${String(t.year).slice(2)}`,
    value: t.avgIkmConvert,
    responden: t.totalResponden,
  }));

  const opdColumns = [
    {
      key: 'rank',
      header: '#',
      render: (_: unknown, idx: number) => (
        <span className="text-muted-foreground">{idx + 1}</span>
      ),
    },
    {
      key: 'opdName',
      header: 'Nama OPD',
      render: (row: { opdName: string }) => (
        <span className="font-medium">{row.opdName}</span>
      ),
    },
    {
      key: 'respondenCount',
      header: 'Responden',
      render: (row: { respondenCount: number }) => row.respondenCount,
    },
    {
      key: 'avgIkmConvert',
      header: 'Nilai IKM',
      render: (row: { avgIkmConvert: number }) => (
        <span className="font-semibold tabular-nums">{row.avgIkmConvert.toFixed(2)}</span>
      ),
    },
    {
      key: 'predikat',
      header: 'Predikat',
      render: (row: { avgIkmConvert: number }) => {
        const v = row.avgIkmConvert;
        const p = v >= 88.31 ? 'A' : v >= 76.61 ? 'B' : v >= 65 ? 'C' : 'D';
        return <StatusBadge value={p} tone={predikatTone(p)} />;
      },
    },
  ];

  if (loadingInit) return <LoadingState message="Memuat dashboard IKM..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard IKM"
        description="Analitik Indeks Kepuasan Masyarakat berdasarkan PermenPANRB No. 14/2017."
        meta={<StatusBadge value="9 Unsur" tone="info" />}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {/* Period selector */}
      <SectionCard title="Periode Survei">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {activePeriod && (
            <StatusBadge
              value={activePeriod.status === 'OPEN' ? 'Aktif' : 'Ditutup'}
              tone={activePeriod.status === 'OPEN' ? 'success' : 'neutral'}
            />
          )}
          {summary && (
            <span className="text-sm text-muted-foreground">
              {summary.totalResponden} responden
            </span>
          )}
        </div>
      </SectionCard>

      {/* Stat cards */}
      {loadingSummary ? (
        <LoadingState message="Memuat ringkasan..." />
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Responden"
              value={summary.totalResponden.toLocaleString('id-ID')}
            />
            <StatCard
              label="Nilai IKM"
              value={summary.avgIkmConvert.toFixed(2)}
            />
            <StatCard
              label="Predikat"
              value={summary.predikat}
            />
            <StatCard
              label="Rata-rata Skor"
              value={summary.avgIkmScore.toFixed(2)}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Per-unsur bar chart */}
            <SectionCard title="Rata-rata Nilai per Unsur" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={unsurData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} tickCount={5} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2), 'Avg Score']}
                    labelFormatter={(label) =>
                      unsurData.find((d) => d.shortLabel === label)?.key ?? label
                    }
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                    {unsurData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          entry.value >= 3.5
                            ? '#16a34a'
                            : entry.value >= 2.6
                              ? '#3b82f6'
                              : '#f59e0b'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Skala 1–4 (hijau ≥ 3.5, biru ≥ 2.6, kuning &lt; 2.6)
              </p>
            </SectionCard>

            {/* Predikat donut */}
            <SectionCard title="Distribusi Predikat">
              {predikatData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada data
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={predikatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {predikatData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name: string) => [
                          `${v} responden`,
                          IKM_PREDIKAT_LABELS[name]?.split(' ')[0] ?? name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {predikatData.map((d) => (
                      <span
                        key={d.name}
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: d.color }}
                        />
                        {d.name}: {d.value}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>
          </div>

          {/* OPD Ranking */}
          {summary.byOpd.length > 0 && (
            <SectionCard title="Peringkat OPD">
              <DataTable
                data={[...summary.byOpd].sort((a, b) => b.avgIkmConvert - a.avgIkmConvert)}
                keyField="opdName"
                columns={opdColumns}
                empty="Belum ada data OPD"
              />
            </SectionCard>
          )}
        </>
      ) : null}

      {/* Trend chart */}
      {trendChartData.length > 0 && (
        <SectionCard title="Tren Nilai IKM Antar Periode">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={trendChartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickCount={6} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  name === 'value' ? v.toFixed(2) : v,
                  name === 'value' ? 'Nilai IKM' : 'Responden',
                ]}
              />
              <Bar dataKey="value" name="value" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                {trendChartData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={
                      entry.value >= 88.31
                        ? '#16a34a'
                        : entry.value >= 76.61
                          ? '#3b82f6'
                          : entry.value >= 65
                            ? '#f59e0b'
                            : entry.value > 0
                              ? '#dc2626'
                              : '#e2e8f0'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {Object.entries(IKM_PREDIKAT_LABELS).map(([k, v]) => (
              <span
                key={k}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: PREDIKAT_COLORS[k] }}
                />
                {k}: {v.split(' ')[0]}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
