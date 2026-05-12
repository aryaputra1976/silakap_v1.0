import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  RefreshCcw,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { SiapWorklog, SiapWorklogTeamDashboard } from '@/lib/api/types';
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

export function SiapWorklogDashboardPage() {
  const [dashboard, setDashboard] = useState<SiapWorklogTeamDashboard | null>(
    null,
  );
  const [date, setDate] = useState(toInputDate(new Date()));
  const [from, setFrom] = useState(toInputDate(addDays(new Date(), -6)));
  const [to, setTo] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.get<SiapWorklogTeamDashboard>(
        '/siap/worklogs/dashboard/team',
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
          : 'Gagal memuat dashboard buku kerja',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadExport(type: 'excel' | 'pdf') {
    await apiClient.download(
      `/siap/worklogs/export/${type}?from=${from}&to=${to}`,
      type === 'excel'
        ? `laporan-buku-kerja-${from}-${to}.csv`
        : `laporan-buku-kerja-${from}-${to}.pdf`,
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
        title="Dashboard Buku Kerja Bidang"
        description="Monitoring harian staf: update buku kerja, antrian review, output, volume, dan kendala."
        meta={<StatusBadge value="KABID MONITORING" tone="dark" />}
        actions={
          <>
            <Link to="/siap/worklogs/team">
              <ActionButton icon={ClipboardCheck} variant="secondary">
                Review Buku Kerja
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
              Export Excel
            </ActionButton>

            <ActionButton
              icon={Download}
              onClick={() => void downloadExport('pdf')}
              variant="secondary"
            >
              Export PDF
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
        <LoadingState label="Memuat dashboard buku kerja" />
      ) : dashboard && summary ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Staf"
              value={summary.totalStaff}
              description={`${summary.updatedToday} sudah update hari ini`}
              tone="neutral"
            />
            <StatCard
              icon={CalendarDays}
              label="Belum Update Hari Ini"
              value={summary.notUpdatedToday}
              description={`Kepatuhan harian ${completionRate}%`}
              tone={summary.notUpdatedToday > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={ClipboardCheck}
              label="Menunggu Review"
              value={summary.pendingReview}
              description="Buku kerja SUBMITTED"
              tone={summary.pendingReview > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={BarChart3}
              label="Total Volume"
              value={summary.totalVolumeInPeriod}
              description={`${summary.totalWorklogsInPeriod} buku kerja pada periode`}
              tone="info"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <StatCard
              icon={CheckCircle2}
              label="Approved Periode"
              value={summary.approvedInPeriod}
              tone="success"
            />
            <StatCard
              icon={AlertTriangle}
              label="Perlu Revisi"
              value={summary.revisionInPeriod}
              tone={summary.revisionInPeriod > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={AlertTriangle}
              label="Kendala Dilaporkan"
              value={summary.obstacleCountInPeriod}
              tone={summary.obstacleCountInPeriod > 0 ? 'warning' : 'success'}
            />
          </section>

          <SectionCard
            title="Monitoring Staf"
            description="Kontrol cepat staf yang sudah/belum update, jumlah output, dan kendala periode berjalan."
          >
            <DataTable
              items={dashboard.byStaff}
              rowKey={(item) => item.user.id}
              empty="Belum ada data staf"
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
                        {item.user.unitKerja?.nama ?? '-'}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'today',
                  header: 'Update Hari Ini',
                  render: (item) => (
                    <div className="space-y-1">
                      <StatusBadge
                        value={
                          item.hasUpdatedToday
                            ? 'SUDAH UPDATE'
                            : 'BELUM UPDATE'
                        }
                        tone={item.hasUpdatedToday ? 'success' : 'danger'}
                      />
                      <div className="text-xs text-muted-foreground">
                        {item.todayWorklogCount} buku kerja
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'period',
                  header: 'Periode',
                  render: (item) => (
                    <div className="text-sm">
                      <div>{item.worklogCount} worklog</div>
                      <div className="text-xs text-muted-foreground">
                        Volume {item.totalVolume}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => (
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge value={`APP ${item.approved}`} tone="success" />
                      <StatusBadge value={`SUB ${item.submitted}`} tone="info" />
                      <StatusBadge
                        value={`REV ${item.revisionRequired}`}
                        tone={item.revisionRequired > 0 ? 'danger' : 'neutral'}
                      />
                    </div>
                  ),
                },
                {
                  key: 'obstacle',
                  header: 'Kendala',
                  render: (item) => (
                    <StatusBadge
                      value={`${item.obstacleCount} KENDALA`}
                      tone={item.obstacleCount > 0 ? 'warning' : 'success'}
                    />
                  ),
                },
                {
                  key: 'last',
                  header: 'Terakhir',
                  render: (item) => formatDate(item.lastWorklogAt),
                },
              ]}
            />
          </SectionCard>

          <section className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              title="Staf Belum Update Hari Ini"
              description="Daftar staf yang belum mengisi buku kerja pada tanggal monitor."
            >
              <DataTable
                items={dashboard.notUpdatedToday}
                rowKey={(item) => item.id}
                empty="Semua staf sudah update hari ini"
                columns={[
                  {
                    key: 'name',
                    header: 'Nama',
                    render: (item) => (
                      <div>
                        <div className="font-semibold text-zinc-950">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{item.username}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'unit',
                    header: 'Unit',
                    render: (item) => item.unitKerja?.nama ?? '-',
                  },
                  {
                    key: 'roles',
                    header: 'Role',
                    render: (item) => (
                      <div className="flex flex-wrap gap-1">
                        {item.roles.slice(0, 2).map((role) => (
                          <StatusBadge key={role} value={role} />
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Antrian Review"
              description="Buku kerja SUBMITTED yang perlu segera direview."
            >
              <WorklogMiniTable items={dashboard.pendingReview} />
            </SectionCard>
          </section>

          <SectionCard
            title="Kendala Terbaru"
            description="Kendala staf pada periode yang dipilih."
          >
            <DataTable
              items={dashboard.recentObstacles}
              rowKey={(item) => item.id}
              empty="Belum ada kendala pada periode ini"
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
                        {formatDate(item.workDate)}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'activity',
                  header: 'Kegiatan',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-zinc-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.category}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'obstacle',
                  header: 'Kendala',
                  render: (item) => (
                    <p className="max-w-xl text-sm text-amber-800">
                      {item.obstacle}
                    </p>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => <StatusBadge value={item.status} />,
                },
              ]}
            />
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function WorklogMiniTable({ items }: { items: SiapWorklog[] }) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty="Tidak ada antrian review"
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
                {formatDate(item.workDate)}
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
                {item.output ?? '-'}
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.status} tone="info" />,
        },
      ]}
    />
  );
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}