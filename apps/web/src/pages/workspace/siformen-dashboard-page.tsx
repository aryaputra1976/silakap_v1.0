import { useCallback, useEffect, useState } from 'react';
import { Building2, Users, FileCheck, ClipboardList, RefreshCcw, Loader2, TrendingUp, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  siformenApi,
  formasiStatusLabel,
  formasiStatusTone,
  jenisFormasiLabel,
  type SiformenDashboard,
} from '@/lib/api/siformen';

const CURRENT_YEAR = new Date().getFullYear();

const SOP_REFERENSI = [
  {
    kode: 'SOP-BKPSDM-FNG-001',
    judul: 'Penyusunan Rencana Kebutuhan ASN',
    deskripsi: 'Penyusunan kebutuhan ASN berdasarkan Analisis Jabatan, ABK, bezetting, dan usulan formasi.',
    target: '1 Dokumen / Tahunan',
    rhk: '1',
    modul: 'Jabatan + ABK + Bezetting + Formasi',
    hrefSop: '/kinerja-bidang/sop?stage=TAHAP_3',
  },
  {
    kode: 'SOP-BKPSDM-FNG-002',
    judul: 'Verifikasi Usulan Formasi ASN',
    deskripsi: 'Verifikasi dan persetujuan usulan formasi ASN dari perangkat daerah.',
    target: '1 Dokumen / Tahunan',
    rhk: '1',
    modul: 'Usulan Formasi → workflow SUBMITTED → APPROVED',
    hrefSop: '/kinerja-bidang/sop?stage=TAHAP_3',
  },
  {
    kode: 'SOP-BKPSDM-PGD-001',
    judul: 'Pengendalian Pelaksanaan Pengadaan ASN',
    deskripsi: 'Pengendalian tahapan pengadaan ASN (CPNS/PPPK) sampai pelaporan hasil pengadaan.',
    target: '5 Laporan / Tahunan',
    rhk: '1 ✓ RHK Primer',
    modul: 'Output dari Formasi yang disetujui',
    hrefSop: '/kinerja-bidang/sop?stage=TAHAP_3',
  },
];

export function SiformenDashboardPage() {
  const [data, setData] = useState<SiformenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tahun, setTahun] = useState(CURRENT_YEAR);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    siformenApi
      .getDashboard(tahun)
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch((caught) => {
        if (mounted)
          setError(caught instanceof Error ? caught.message : 'Gagal memuat data dashboard');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tahun]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="SIFORMEN — Formasi & Bezetting ASN"
        description="Sistem Informasi Formasi dan Bezetting ASN. Kelola peta jabatan, pengisian posisi, Analisis Beban Kerja, dan usulan formasi CPNS/PPPK."
        meta={<StatusBadge value="Dashboard" tone="dark" />}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
            >
              <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
              <option value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</option>
              <option value={CURRENT_YEAR + 1}>{CURRENT_YEAR + 1}</option>
            </select>
            <ActionButton
              icon={loading ? Loader2 : RefreshCcw}
              variant="secondary"
              disabled={loading}
              onClick={load}
            >
              Refresh
            </ActionButton>
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading && !data ? (
        <LoadingState label="Memuat data SIFORMEN" />
      ) : data ? (
        <>
          {/* Stat Cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Jabatan Aktif"
              value={String(data.jabatan.total)}
              tone="info"
              icon={Building2}
            />
            <StatCard
              label="Posisi Terisi"
              value={`${data.bezetting.fillRate}%`}
              tone={data.bezetting.fillRate >= 80 ? 'success' : data.bezetting.fillRate >= 50 ? 'warning' : 'danger'}
              icon={Users}
            />
            <StatCard
              label="Usulan Formasi"
              value={String(data.formasi.total)}
              tone="warning"
              icon={FileCheck}
            />
            <StatCard
              label="Entri ABK"
              value={String(data.abk.total)}
              tone="neutral"
              icon={ClipboardList}
            />
          </div>

          {/* Bezetting Summary */}
          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard
              title={`Bezetting Tahun ${tahun}`}
              description={`Distribusi pengisian jabatan per status — total ${data.bezetting.total} posisi`}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Terisi', value: data.bezetting.filled, tone: 'success' as const },
                  { label: 'Kosong', value: data.bezetting.vacant, tone: 'danger' as const },
                  { label: 'Plt', value: data.bezetting.acting, tone: 'warning' as const },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3 text-center">
                    <div className="text-2xl font-bold text-foreground">{item.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              {data.bezetting.total > 0 ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Tingkat Pengisian</span>
                    <span>{data.bezetting.fillRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(data.bezetting.fillRate, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Usulan Formasi"
              description="Rekap usulan formasi CPNS dan PPPK berdasarkan status"
            >
              {data.formasi.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada usulan formasi</p>
              ) : (
                <div className="space-y-2">
                  {data.formasi.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <StatusBadge
                        value={formasiStatusLabel(s.status)}
                        tone={formasiStatusTone(s.status)}
                      />
                      <div className="text-right">
                        <span className="font-medium text-foreground">{s.count}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({s.totalUsulan} posisi)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.formasi.byJenis.length > 0 ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Per Jenis</p>
                  <div className="flex gap-3">
                    {data.formasi.byJenis.map((j) => (
                      <div key={j.jenisFormasi} className="rounded-md bg-muted px-3 py-2 text-center">
                        <div className="text-lg font-bold text-foreground">{j.totalUsulan}</div>
                        <div className="text-xs text-muted-foreground">
                          {jenisFormasiLabel(j.jenisFormasi)}
                        </div>
                        <div className="text-xs text-muted-foreground">{j.count} usulan</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </SectionCard>
          </div>

          {/* Quick links */}
          <SectionCard
            title="Navigasi Cepat"
            description="Akses langsung ke sub-modul SIFORMEN"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Peta Jabatan', desc: 'Daftar dan kelola referensi jabatan', href: '/siformen/jabatan', icon: Building2 },
                { label: 'Bezetting', desc: 'Pengisian posisi jabatan ASN', href: '/siformen/bezetting', icon: Users },
                { label: 'Usulan Formasi', desc: 'Ajukan formasi CPNS dan PPPK', href: '/siformen/formasi', icon: FileCheck },
                { label: 'Analisis Beban Kerja', desc: 'Hitung kebutuhan pegawai', href: '/siformen/abk', icon: TrendingUp },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-ring hover:bg-muted"
                >
                  <item.icon className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </a>
              ))}
            </div>
          </SectionCard>

          {/* Referensi SOP */}
          <SectionCard
            title="Referensi SOP Terkait"
            description="SOP Bidang PPIK yang diimplementasikan oleh modul SIFORMEN — Tahap 3 Fungsi Spesifik Bidang"
          >
            <div className="space-y-3">
              {SOP_REFERENSI.map((sop) => (
                <div
                  key={sop.kode}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <BookOpen className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {sop.kode}
                      </span>
                      <span className="text-sm font-medium text-foreground">{sop.judul}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sop.deskripsi}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3" />
                        {sop.target}
                      </span>
                      <span className="text-xs text-muted-foreground">RHK {sop.rhk}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-muted-foreground">{sop.modul}</span>
                    </div>
                  </div>
                  <a
                    href={sop.hrefSop}
                    className="flex-shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                    title="Lihat SOP di Kinerja Bidang"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Dasar hukum: PermenPANRB No. 1 Tahun 2020 tentang Pedoman Penyusunan Kebutuhan Pegawai ASN.
            </p>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
