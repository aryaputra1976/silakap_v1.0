import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  RefreshCcw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  SiapWorklog,
  SiapWorklogDashboardUnitRow,
  SiapWorklogExecutiveDashboard,
} from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  formatDate,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';
import {
  worklogStatusLabel,
  worklogStatusTone,
} from '@/lib/siap/siap-labels';

export function SiapWorklogExecutivePage() {
  const [dashboard, setDashboard] =
    useState<SiapWorklogExecutiveDashboard | null>(null);
  const [date, setDate] = useState(toInputDate(new Date()));
  const [from, setFrom] = useState(toInputDate(addDays(new Date(), -6)));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.get<SiapWorklogExecutiveDashboard>(
        '/siap/worklogs/dashboard/executive',
        {
          date,
          from,
          to,
        },
      );

      setDashboard(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dashboard pimpinan',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadExport(type: 'excel' | 'pdf') {
    await apiClient.download(
      `/siap/worklogs/export/${type}?from=${from}&to=${to}`,
      type === 'excel'
        ? `laporan-buku-kerja-pimpinan-${from}-${to}.csv`
        : `laporan-buku-kerja-pimpinan-${from}-${to}.pdf`,
    );
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = dashboard?.summary;

  const completionRate = useMemo(() => {
    if (!summary || summary.totalStaff === 0) {
      return 0;
    }

    return Math.round((summary.updatedToday / summary.totalStaff) * 100);
  }, [summary]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Pimpinan SIAP"
        description="Pantau buku kerja lintas bidang: kepatuhan pengisian, hasil pekerjaan, kendala, dan unit yang perlu perhatian."
        meta={<StatusBadge value="Monitoring Pimpinan" tone="dark" />}
        actions={
          <>
            <Link to="/siap/worklogs/dashboard">
              <ActionButton icon={BarChart3} variant="secondary">
                Dashboard Bidang
              </ActionButton>
            </Link>
            <ActionButton icon={RefreshCcw} onClick={() => void load()}>
              Refresh
            </ActionButton>
            <ActionButton
              icon={Download}
              onClick={() => void downloadExport('excel')}
              variant="secondary"
            >
              Excel
            </ActionButton>

            <ActionButton
              icon={Download}
              onClick={() => void downloadExport('pdf')}
              variant="secondary"
            >
              PDF
            </ActionButton>            
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <Toolbar>
        <div className="grid w-full gap-3 md:grid-cols-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-zinc-800">Tanggal Monitor</span>
            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-zinc-800">Dari</span>
            <input
              className={inputClass}
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-zinc-800">Sampai</span>
            <input
              className={inputClass}
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <div className="flex items-end">
            <ActionButton
              icon={CalendarDays}
              onClick={() => void load()}
              variant="secondary"
            >
              Terapkan
            </ActionButton>
          </div>
        </div>
      </Toolbar>

      {loading ? (
        <LoadingState label="Memuat dashboard pimpinan" />
      ) : dashboard && summary ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Staf"
              value={summary.totalStaff}
              description={`${completionRate}% sudah update hari ini`}
              tone="neutral"
            />
            <StatCard
              icon={ShieldAlert}
              label="Unit Perlu Perhatian"
              value={dashboard.executiveNotes.attentionNeededUnits}
              description={`${dashboard.executiveNotes.highRiskUnitCount} unit risiko tinggi`}
              tone={
                dashboard.executiveNotes.attentionNeededUnits > 0
                  ? 'danger'
                  : 'success'
              }
            />
            <StatCard
              icon={ClipboardCheck}
              label="Antrian Tinjauan"
              value={summary.pendingReview}
              description="Buku kerja yang sudah dikirim"
              tone={summary.pendingReview > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={BarChart3}
              label="Total Volume"
              value={summary.totalVolumeInPeriod}
              description={`${summary.totalWorklogsInPeriod} buku kerja periode`}
              tone="info"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Belum Update Hari Ini"
              value={summary.notUpdatedToday}
              tone={summary.notUpdatedToday > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={CheckCircle2}
              label="Disetujui"
              value={summary.approvedInPeriod}
              tone="success"
            />
            <StatCard
              icon={AlertTriangle}
              label="Perlu Perbaikan"
              value={summary.revisionInPeriod}
              tone={summary.revisionInPeriod > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={AlertTriangle}
              label="Kendala"
              value={summary.obstacleCountInPeriod}
              tone={summary.obstacleCountInPeriod > 0 ? 'warning' : 'success'}
            />
          </section>

          <SectionCard
            title="Monitoring Per Bidang / Unit"
            description="Unit dengan skor kesehatan terendah tampil paling atas."
          >
            <DataTable
              items={dashboard.byUnit}
              rowKey={(item) => item.unit.id}
              empty="Belum ada data unit"
              columns={[
                {
                  key: 'unit',
                  header: 'Unit / Bidang',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-zinc-950">
                        {item.unit.nama}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.unit.kode}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'health',
                  header: 'Kondisi',
                  render: (item) => (
                    <StatusBadge
                      value={`${item.healthScore}%`}
                      tone={healthTone(item.healthScore)}
                    />
                  ),
                },
                {
                  key: 'staff',
                  header: 'Staf',
                  render: (item) => (
                    <div className="text-sm">
                      <div>{item.totalStaff} staf</div>
                      <div className="text-xs text-muted-foreground">
                        {item.updatedToday} update hari ini
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'notUpdated',
                  header: 'Belum Update',
                  render: (item) => (
                    <StatusBadge
                      value={String(item.notUpdatedToday)}
                      tone={item.notUpdatedToday > 0 ? 'danger' : 'success'}
                    />
                  ),
                },
                {
                  key: 'review',
                  header: 'Tinjauan',
                  render: (item) => (
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge
                        value={`Dikirim ${item.pendingReview}`}
                        tone={item.pendingReview > 0 ? 'warning' : 'success'}
                      />
                      <StatusBadge
                        value={`Perbaikan ${item.revisionRequired}`}
                        tone={item.revisionRequired > 0 ? 'danger' : 'neutral'}
                      />
                    </div>
                  ),
                },
                {
                  key: 'output',
                  header: 'Output',
                  render: (item) => (
                    <div className="text-sm">
                      <div>{item.worklogCount} buku kerja</div>
                      <div className="text-xs text-muted-foreground">
                        Volume {item.totalVolume}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'obstacle',
                  header: 'Kendala',
                  render: (item) => (
                    <StatusBadge
                      value={String(item.obstacleCount)}
                      tone={item.obstacleCount > 0 ? 'warning' : 'success'}
                    />
                  ),
                },
              ]}
            />
          </SectionCard>

          <section className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Unit Risiko Tertinggi"
              description="Ringkasan cepat unit yang perlu tindak lanjut pimpinan."
            >
              <RiskUnitList items={dashboard.byUnit.slice(0, 8)} />
            </SectionCard>

            <SectionCard
              title="Isu Strategis / Kendala Terbaru"
              description="Kendala dari staf lintas bidang pada periode berjalan."
            >
              <StrategicIssues items={dashboard.strategicIssues.slice(0, 8)} />
            </SectionCard>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Antrian Tinjauan Lintas Bidang"
              description="Buku kerja yang menunggu tinjauan Kabid atau pejabat terkait."
            >
              <WorklogMiniTable items={dashboard.pendingReview.slice(0, 8)} />
            </SectionCard>

            <SectionCard
              title="Distribusi Kategori"
              description="Jenis aktivitas yang paling banyak dilaporkan pada periode ini."
            >
              <CategoryDistribution
                items={dashboard.categoryDistribution.slice(0, 10)}
              />
            </SectionCard>
          </section>
        </>
      ) : null}
    </div>
  );
}

function RiskUnitList({ items }: { items: SiapWorklogDashboardUnitRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-muted-foreground">
        Belum ada data unit.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.unit.id}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-zinc-950">
                {item.unit.nama}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.totalStaff} staf - {item.worklogCount} buku kerja - volume{' '}
                {item.totalVolume}
              </div>
            </div>
            <StatusBadge
              value={`${item.healthScore}%`}
              tone={healthTone(item.healthScore)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge
              value={`${item.notUpdatedToday} belum update`}
              tone={item.notUpdatedToday > 0 ? 'danger' : 'success'}
            />
            <StatusBadge
              value={`${item.pendingReview} tinjauan`}
              tone={item.pendingReview > 0 ? 'warning' : 'success'}
            />
            <StatusBadge
              value={`${item.obstacleCount} kendala`}
              tone={item.obstacleCount > 0 ? 'warning' : 'success'}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StrategicIssues({ items }: { items: SiapWorklog[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-muted-foreground">
        Belum ada kendala strategis pada periode ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <div className="font-semibold text-amber-950">{item.title}</div>
              <div className="mt-1 text-xs text-amber-800">
                {item.user.name} · {item.unitKerja?.nama ?? '-'} ·{' '}
                {formatDate(item.workDate)}
              </div>
              <p className="mt-2 text-sm leading-5 text-amber-900">
                {item.obstacle}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorklogMiniTable({ items }: { items: SiapWorklog[] }) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty="Tidak ada antrian tinjauan"
      columns={[
        {
          key: 'staff',
          header: 'Staf',
          render: (item) => (
            <div>
              <div className="font-semibold text-zinc-950">
                {item.user.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.unitKerja?.nama ?? '-'}
              </div>
            </div>
          ),
        },
        {
          key: 'title',
          header: 'Kegiatan',
          render: (item) => (
            <div>
              <div className="font-semibold text-zinc-900">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(item.workDate)}
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={worklogStatusLabel(item.status)}
              tone={worklogStatusTone(item.status)}
            />
          ),
        },
      ]}
    />
  );
}

function CategoryDistribution({
  items,
}: {
  items: Array<{ key: string; label: string; total: number }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-muted-foreground">
        Belum ada kategori aktivitas.
      </div>
    );
  }

  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-zinc-900">{item.label}</span>
            <span className="text-muted-foreground">{item.total}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-zinc-900"
              style={{ width: `${Math.max((item.total / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function healthTone(score: number) {
  if (score >= 85) {
    return 'success' as const;
  }

  if (score >= 65) {
    return 'warning' as const;
  }

  return 'danger' as const;
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}
