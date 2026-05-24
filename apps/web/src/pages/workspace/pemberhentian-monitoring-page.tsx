import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCcw,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
} from '@/components/workspace/ui';
import {
  getMonitoring,
  JENIS_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  type AsnMendekatiPensiun,
  type MonitoringResult,
  type StatusPemberhentian,
} from '@/lib/api/pemberhentian';

const BULAN_OPTIONS = [3, 6, 12, 24];

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-gray-400">—</span>;
  const cls =
    days <= 90
      ? 'bg-red-100 text-red-700 font-semibold'
      : days <= 180
        ? 'bg-orange-100 text-orange-700'
        : days <= 365
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${cls}`}>
      {days} hari
    </span>
  );
}

function StatusBadge({ status }: { status: StatusPemberhentian }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[#cfe1da] bg-white p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#18343a]">{value}</p>
        <p className="text-xs text-[#687967]">{label}</p>
      </div>
    </div>
  );
}

function AsnRow({ asn, onBuat }: { asn: AsnMendekatiPensiun; onBuat: (asnId: string) => void }) {
  const navigate = useNavigate();
  const tmt = asn.tmtPensiun ? new Date(asn.tmtPensiun).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <tr className="border-b border-[#e8f0e5] hover:bg-[#f9fbf8] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0e5] text-[#3a6b52]">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#18343a]">{asn.nama}</p>
            <p className="text-xs text-[#687967]">{asn.nip}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-[#3a3a3a]">{asn.jabatanNama ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-[#3a3a3a]">{asn.golonganNama ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-[#3a3a3a]">{asn.unitKerja?.nama ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-[#3a3a3a]">{tmt}</span>
          <DaysBadge days={asn.hariMenujuPensiun} />
        </div>
      </td>
      <td className="px-4 py-3">
        {asn.prosesAktif ? (
          <div className="flex flex-col gap-1">
            <StatusBadge status={asn.prosesAktif.status} />
            <span className="text-xs text-[#687967]">{JENIS_LABEL[asn.prosesAktif.jenisPemberhentian]}</span>
            <button
              onClick={() => navigate(`/pemberhentian/proses/${asn.prosesAktif!.id}`)}
              className="text-xs text-[#3a6b52] hover:underline text-left"
            >
              Lihat detail
            </button>
          </div>
        ) : (
          <button
            onClick={() => onBuat(asn.id)}
            className="rounded border border-[#3a6b52] px-2.5 py-1 text-xs font-medium text-[#3a6b52] hover:bg-[#e8f0e5] transition-colors"
          >
            Buat Proses
          </button>
        )}
      </td>
    </tr>
  );
}

export function PemberhentianMonitoringPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulan, setBulan] = useState(12);

  const load = useCallback(async (b: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMonitoring(b);
      setData(res);
    } catch {
      setError('Gagal memuat data monitoring');
      toast.error('Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(bulan); }, [load, bulan]);

  const summary = data?.statusSummary ?? {};
  const totalAktif = Object.entries(summary)
    .filter(([s]) => !['SELESAI', 'DIBATALKAN'].includes(s))
    .reduce((a, [, v]) => a + v, 0);
  const totalSelesai = (summary['SELESAI'] as number) ?? 0;
  const totalDikembalikan = (summary['DIKEMBALIKAN'] as number) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Pemberhentian"
        description="Pantau ASN mendekati batas usia pensiun dan status proses pemberhentian aktif"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="rounded border border-[#c8d8c3] bg-white px-3 py-1.5 text-sm text-[#18343a] focus:outline-none focus:ring-2 focus:ring-[#3a6b52]"
            >
              {BULAN_OPTIONS.map((m) => (
                <option key={m} value={m}>{m} bulan ke depan</option>
              ))}
            </select>
            <button
              onClick={() => load(bulan)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded border border-[#c8d8c3] bg-white px-3 py-1.5 text-sm text-[#3a6b52] hover:bg-[#e8f0e5] disabled:opacity-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/pemberhentian/proses')}
              className="flex items-center gap-1.5 rounded bg-[#3a6b52] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2d5340]"
            >
              <FileText className="h-3.5 w-3.5" />
              Semua Proses
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="ASN Mendekati Pensiun"
          value={data?.asnMendekatiPensiun.length ?? 0}
          icon={Clock}
          colorClass="bg-yellow-100 text-yellow-700"
        />
        <SummaryCard
          label="Proses Aktif"
          value={totalAktif}
          icon={FileText}
          colorClass="bg-blue-100 text-blue-700"
        />
        <SummaryCard
          label="Selesai"
          value={totalSelesai}
          icon={CheckCircle2}
          colorClass="bg-green-100 text-green-700"
        />
        <SummaryCard
          label="Dikembalikan BKN"
          value={totalDikembalikan}
          icon={AlertTriangle}
          colorClass="bg-red-100 text-red-700"
        />
      </div>

      {error && <ErrorAlert message={error} />}

      <SectionCard
        title={`ASN Mendekati BUP — ${bulan} Bulan Ke Depan`}
        description="Berdasarkan data tmtPensiun di SIDATA ASN. BUP: JPT Utama/Madya/Pratama 60 th, Administrator/Pengawas/Pelaksana 58 th (UU 20/2023 Pasal 55)"
      >
        {loading ? (
          <LoadingState message="Memuat data monitoring..." />
        ) : !data || data.asnMendekatiPensiun.length === 0 ? (
          <EmptyState
            title="Tidak Ada ASN Mendekati Pensiun"
            description={`Tidak ada ASN dengan TMT pensiun dalam ${bulan} bulan ke depan`}
            icon={Clock}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#cfe1da] text-xs text-[#687967]">
                  <th className="px-4 py-2 text-left font-medium">ASN</th>
                  <th className="px-4 py-2 text-left font-medium">Jabatan</th>
                  <th className="px-4 py-2 text-left font-medium">Gol/Pangkat</th>
                  <th className="px-4 py-2 text-left font-medium">Unit Kerja</th>
                  <th className="px-4 py-2 text-left font-medium">TMT Pensiun</th>
                  <th className="px-4 py-2 text-left font-medium">Status Proses</th>
                </tr>
              </thead>
              <tbody>
                {data.asnMendekatiPensiun.map((asn) => (
                  <AsnRow
                    key={asn.id}
                    asn={asn}
                    onBuat={(id) => navigate(`/pemberhentian/proses/baru?asnId=${id}&jenis=DH_BUP`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Status breakdown */}
      {data && Object.keys(data.statusSummary).length > 0 && (
        <SectionCard title="Rekap Status Proses">
          <div className="flex flex-wrap gap-3">
            {(Object.entries(data.statusSummary) as [StatusPemberhentian, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => navigate(`/pemberhentian/proses?status=${status}`)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:opacity-80 ${STATUS_COLOR[status]}`}
                >
                  <span className="font-semibold">{count}</span>
                  <span>{STATUS_LABEL[status]}</span>
                </button>
              ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
