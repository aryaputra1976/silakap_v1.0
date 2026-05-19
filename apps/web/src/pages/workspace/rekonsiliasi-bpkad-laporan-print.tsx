import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { LaporanStats, ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import { FINDING_LABELS } from '@/lib/reconciliation-bpkad/types';

const MONTH_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function fmt(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtPct(n: number): string {
  return `${n}%`;
}

function indikatorRows(stats: LaporanStats, matchPct: number) {
  const f = stats.findings;
  return [
    {
      indikator: 'Kesesuaian data BKPSDM – BPKAD (NIP)',
      target: '≥ 95%',
      capaian: fmtPct(matchPct),
      status: matchPct >= 95 ? 'TERCAPAI' : 'BELUM TERCAPAI',
    },
    {
      indikator: 'ASN pensiun/meninggal masih aktif gaji (R03)',
      target: '0 kasus',
      capaian: `${f.byCode['R03'] ?? 0} kasus`,
      status: (f.byCode['R03'] ?? 0) === 0 ? 'TERCAPAI' : 'BELUM TERCAPAI',
    },
    {
      indikator: 'ASN aktif belum masuk payroll (R01)',
      target: '0 kasus',
      capaian: `${f.byCode['R01'] ?? 0} kasus`,
      status: (f.byCode['R01'] ?? 0) === 0 ? 'TERCAPAI' : 'BELUM TERCAPAI',
    },
    {
      indikator: 'RTL diselesaikan tepat waktu',
      target: '≥ 90%',
      capaian: fmtPct(f.resolvedPct),
      status: f.resolvedPct >= 90 ? 'TERCAPAI' : 'BELUM TERCAPAI',
    },
  ];
}

export function RekonsiliasiBpkadLaporanPrintPage() {
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get('periodId') ?? '';

  const [period, setPeriod] = useState<ReconciliationPeriod | null>(null);
  const [stats, setStats] = useState<LaporanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!periodId) { setError('Parameter periodId tidak ditemukan.'); setLoading(false); return; }
    try {
      const [periods, s] = await Promise.all([
        reconciliationBpkadApi.fetchPeriods(),
        reconciliationBpkadApi.fetchLaporanStats(periodId),
      ]);
      setPeriod(periods.find((p) => p.id === periodId) ?? null);
      setStats(s);
    } catch {
      setError('Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && stats) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, stats]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>Memuat data laporan...</div>;
  }

  if (error || !stats) {
    return <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: 'red' }}>{error || 'Data tidak tersedia.'}</div>;
  }

  const run = stats.matchingRun;
  const ba = stats.beritaAcara;
  const f = stats.findings;
  const matchPct = run && run.totalBkpsdm > 0
    ? Math.round((run.totalMatched / run.totalBkpsdm) * 100)
    : 0;

  const periodLabel = period
    ? period.periodType === 'MONTHLY' && period.periodMonth
      ? `${MONTH_NAMES[period.periodMonth]} ${period.periodYear}`
      : period.periodType === 'QUARTERLY' && period.periodQuarter
        ? `Triwulan ${period.periodQuarter} Tahun ${period.periodYear}`
        : period.title
    : '—';

  const printedAt = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000', maxWidth: 794, margin: '0 auto', padding: '20px 32px' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm 20mm 20mm 25mm; }
          body { margin: 0; }
          button { display: none !important; }
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #555; padding: 5px 8px; vertical-align: top; }
        th { background: #e8e8e8; font-weight: bold; text-align: center; }
      `}</style>

      {/* Kop surat */}
      <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
          PEMERINTAH KABUPATEN TOLITOLI
        </div>
        <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
          BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA
        </div>
        <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
          Jl. Letjen S. Parman, Tolitoli — Sulawesi Tengah
        </div>
      </div>

      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }}>
          LAPORAN REKONSILIASI DATA ASN
        </div>
        <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
          BKPSDM – BPKAD (SIMGAJI)
        </div>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          Periode: {periodLabel}
        </div>
      </div>

      {/* Ringkasan Matching */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
          I. HASIL PENCOCOKAN DATA (MATCHING)
        </div>
        {run ? (
          <table>
            <tbody>
              <tr>
                <td style={{ width: '40%' }}>Jumlah Data BKPSDM/SIASN</td>
                <td>{run.totalBkpsdm.toLocaleString('id-ID')} ASN</td>
              </tr>
              <tr>
                <td>Jumlah Data Simgaji BPKAD</td>
                <td>{run.totalBpkad.toLocaleString('id-ID')} ASN</td>
              </tr>
              <tr>
                <td>Data Cocok (NIP sama)</td>
                <td>{run.totalMatched.toLocaleString('id-ID')} ASN</td>
              </tr>
              <tr>
                <td>Persentase Kesesuaian</td>
                <td style={{ fontWeight: 'bold' }}>{matchPct}%</td>
              </tr>
              <tr>
                <td>Total Temuan</td>
                <td>{run.totalFindings.toLocaleString('id-ID')} temuan</td>
              </tr>
              <tr>
                <td>Tanggal Pencocokan</td>
                <td>{fmt(run.runAt)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#666' }}>Belum ada data matching untuk periode ini.</p>
        )}
      </div>

      {/* Distribusi Temuan */}
      {f.total > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
            II. DISTRIBUSI TEMUAN PER KODE
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Kode</th>
                <th style={{ width: '50%' }}>Uraian</th>
                <th style={{ width: '12%' }}>Prioritas</th>
                <th style={{ width: '10%' }}>Jumlah</th>
                <th style={{ width: '20%' }}>Status RTL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(f.byCode)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, count]) => (
                  <tr key={code}>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</td>
                    <td>{FINDING_LABELS[code] ?? code}</td>
                    <td style={{ textAlign: 'center' }}>
                      {['R01', 'R02', 'R03', 'R04', 'R08', 'R09'].includes(code) ? 'SEGERA' : 'BULAN INI'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{count}</td>
                    <td style={{ textAlign: 'center' }}>—</td>
                  </tr>
                ))}
              <tr>
                <td colSpan={3} style={{ fontWeight: 'bold', textAlign: 'right' }}>TOTAL</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{f.total}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Status Tindak Lanjut */}
      {f.total > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
            III. STATUS TINDAK LANJUT (RTL)
          </div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Jumlah</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(f.byStatus).map(([status, count]) => {
                const labels: Record<string, string> = {
                  OPEN: 'Terbuka (belum ditindaklanjuti)',
                  NEEDS_CLARIFICATION: 'Menunggu klarifikasi OPD',
                  IN_FOLLOW_UP: 'Sedang dalam tindak lanjut',
                  RESOLVED: 'Selesai ditindaklanjuti',
                  REJECTED: 'Ditolak',
                };
                return (
                  <tr key={status}>
                    <td>{labels[status] ?? status}</td>
                    <td style={{ textAlign: 'center' }}>{count}</td>
                    <td style={{ textAlign: 'center' }}>
                      {f.total > 0 ? Math.round((count / f.total) * 100) : 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Indikator Keberhasilan */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
          IV. INDIKATOR KEBERHASILAN SOP
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Indikator</th>
              <th>Target SOP</th>
              <th>Capaian</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {indikatorRows(stats, matchPct).map((row, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.indikator}</td>
                <td style={{ textAlign: 'center' }}>{row.target}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.capaian}</td>
                <td style={{ textAlign: 'center', color: row.status === 'TERCAPAI' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Berita Acara */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>
          V. BERITA ACARA REKONSILIASI
        </div>
        {ba ? (
          <table>
            <tbody>
              <tr>
                <td style={{ width: '40%' }}>Status BA</td>
                <td style={{ fontWeight: 'bold' }}>{ba.status}</td>
              </tr>
              {ba.nomorBA && <tr><td>Nomor BA</td><td>{ba.nomorBA}</td></tr>}
              {ba.tanggalBA && <tr><td>Tanggal BA</td><td>{fmt(ba.tanggalBA)}</td></tr>}
              {ba.finalizedAt && <tr><td>Difinalisasi pada</td><td>{fmt(ba.finalizedAt)}</td></tr>}
              {ba.notes && <tr><td>Catatan</td><td>{ba.notes}</td></tr>}
            </tbody>
          </table>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#666' }}>Berita Acara belum dibuat.</p>
        )}
      </div>

      {/* Tanda Tangan */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', width: 220 }}>
          <div>Tolitoli, {printedAt}</div>
          <div style={{ marginTop: 4 }}>Kepala BKPSDM Kabupaten Tolitoli,</div>
          <div style={{ marginTop: 70, borderTop: '1px solid #000', paddingTop: 4, fontWeight: 'bold' }}>
            ..........................................................
          </div>
          <div style={{ fontSize: 11 }}>NIP. ..........................................</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, borderTop: '1px solid #999', paddingTop: 8, fontSize: 10, color: '#666', textAlign: 'center' }}>
        Dicetak oleh SILAKAP — Sistem Informasi Layanan Kepegawaian — Tanggal Cetak: {printedAt}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 24px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}
        >
          Cetak / Simpan PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            marginLeft: 12, padding: '8px 24px', background: '#e5e7eb', color: '#374151',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
