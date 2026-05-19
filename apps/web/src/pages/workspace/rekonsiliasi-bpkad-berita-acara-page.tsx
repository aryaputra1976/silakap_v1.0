import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { reconciliationBpkadApi } from '@/lib/api/reconciliation-bpkad';
import type { ReconciliationBeritaAcara, ReconciliationPeriod } from '@/lib/reconciliation-bpkad/types';
import {
  ActionButton,
  EmptyState,
  ErrorAlert,
  Field,
  formatDate,
  formatDateTime,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';

const FINDING_CODE_LABELS: Record<string, string> = {
  R01: 'Ada di BKPSDM, tidak di BPKAD',
  R02: 'Ada di BPKAD, tidak di BKPSDM',
  R03: 'Status kepegawaian berbeda',
  R04: 'Pangkat/golongan berbeda',
  R05: 'Jabatan berbeda',
  R06: 'Unit kerja/OPD berbeda',
  R08: 'Nama/NIP bermasalah',
  R09: 'ASN ganda di Simgaji',
};

function BaTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'FINALIZED') return 'success';
  if (status === 'DRAFT') return 'warning';
  return 'neutral';
}

function SummaryByCode({ summaryJson }: { summaryJson: unknown }) {
  if (!summaryJson || typeof summaryJson !== 'object') return null;
  const json = summaryJson as Record<string, unknown>;
  const byCode = json['byCode'] as Record<string, number> | undefined;
  const statusCounts = json['statusCounts'] as Record<string, number> | undefined;
  if (!byCode) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Rincian temuan per kode</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(byCode).map(([code, count]) => (
            <div key={code} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="font-mono font-bold">{code}</span>
              <span className="text-xs text-muted-foreground">{FINDING_CODE_LABELS[code] ?? code}</span>
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>
      {statusCounts && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Status tindak lanjut</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="rounded-full border px-3 py-1 text-xs">
                {status}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RekonsiliasiBpkadBeritaAcaraPage() {
  const [periods, setPeriods] = useState<ReconciliationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [ba, setBa] = useState<ReconciliationBeritaAcara | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [nomorBA, setNomorBA] = useState('');
  const [tanggalBA, setTanggalBA] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    reconciliationBpkadApi
      .fetchPeriods()
      .then((list) => {
        setPeriods(list);
        if (list.length > 0) setSelectedPeriodId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadBa = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.fetchBeritaAcara(periodId);
      setBa(result);
      if (result) {
        setNomorBA(result.nomorBA ?? '');
        setTanggalBA(result.tanggalBA ? result.tanggalBA.split('T')[0] : '');
        setNotes(result.notes ?? '');
      }
    } catch {
      setBa(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) loadBa(selectedPeriodId);
  }, [selectedPeriodId, loadBa]);

  const handleCreateOrUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.createBeritaAcara(selectedPeriodId, {
        nomorBA: nomorBA || undefined,
        tanggalBA: tanggalBA || undefined,
        notes: notes || undefined,
      });
      setBa(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal membuat Berita Acara.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!ba) return;
    setFinalizing(true);
    setError('');
    try {
      const result = await reconciliationBpkadApi.finalizeBeritaAcara(selectedPeriodId, {
        nomorBA: nomorBA || undefined,
        tanggalBA: tanggalBA || undefined,
        notes: notes || undefined,
      });
      setBa(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memfinalisasi Berita Acara.');
    } finally {
      setFinalizing(false);
    }
  };

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);
  const isFinalized = ba?.status === 'FINALIZED';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Berita Acara Rekonsiliasi"
        description="Susun dan finalisasi Berita Acara Rekonsiliasi sebagai dokumen bukti sesuai SOP. BA DRAFT dapat diperbarui; BA FINALIZED tidak dapat diubah."
      />

      <div className="flex items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedPeriodId}
          onChange={(e) => { setSelectedPeriodId(e.target.value); }}
        >
          {periods.length === 0 && <option value="">— belum ada periode —</option>}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        {selectedPeriod && (
          <span className="text-xs text-muted-foreground">
            Periode: {selectedPeriod.title}
          </span>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <LoadingState message="Memuat Berita Acara..." />
      ) : (
        <>
          {ba && (
            <SectionCard
              title="Status Berita Acara"
              description="Ringkasan BA yang sudah dibuat untuk periode ini."
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge tone={BaTone(ba.status)}>
                    {ba.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT'}
                  </StatusBadge>
                  {ba.nomorBA && (
                    <span className="text-sm font-medium">{ba.nomorBA}</span>
                  )}
                  {ba.tanggalBA && (
                    <span className="text-sm text-muted-foreground">
                      Tanggal: {formatDate(ba.tanggalBA)}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md border bg-card p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{ba.totalTemuan}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Temuan</p>
                  </div>
                  <div className="rounded-md border bg-green-50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{ba.totalResolved}</p>
                    <p className="text-xs text-muted-foreground mt-1">Selesai Ditindaklanjuti</p>
                  </div>
                  <div className="rounded-md border bg-yellow-50 p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700">{ba.totalPending}</p>
                    <p className="text-xs text-muted-foreground mt-1">Masih Pending</p>
                  </div>
                </div>

                <SummaryByCode summaryJson={ba.summaryJson} />

                <div className="text-xs text-muted-foreground space-y-1">
                  {ba.draftedAt && <p>Draft dibuat: {formatDateTime(ba.draftedAt)}</p>}
                  {ba.finalizedAt && <p>Difinalisasi: {formatDateTime(ba.finalizedAt)}</p>}
                </div>
              </div>
            </SectionCard>
          )}

          {!ba && (
            <SectionCard
              title="Belum Ada Berita Acara"
              description="Buat draft BA terlebih dahulu. Data akan otomatis diambil dari hasil matching dan tindak lanjut terkini."
            >
              <EmptyState
                icon={FileText}
                title="BA belum dibuat"
                description="Isi form di bawah dan klik 'Buat Draft BA'."
              />
            </SectionCard>
          )}

          {!isFinalized && (
            <SectionCard
              title={ba ? 'Perbarui Berita Acara' : 'Buat Draft Berita Acara'}
              description="Nomor BA dan tanggal akan dicantumkan pada dokumen final."
            >
              <div className="space-y-4 max-w-lg">
                <Field label="Nomor BA (opsional)">
                  <input
                    className={inputClass}
                    placeholder="Contoh: 001/BKPSDM/BA-REKON/V/2026"
                    value={nomorBA}
                    onChange={(e) => setNomorBA(e.target.value)}
                  />
                </Field>
                <Field label="Tanggal BA (opsional)">
                  <input
                    type="date"
                    className={inputClass}
                    value={tanggalBA}
                    onChange={(e) => setTanggalBA(e.target.value)}
                  />
                </Field>
                <Field label="Catatan (opsional)">
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    placeholder="Catatan atau kesimpulan rekonsiliasi..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
                <div className="flex gap-3">
                  <ActionButton
                    icon={saving ? Loader2 : FileText}
                    onClick={handleCreateOrUpdate}
                    disabled={saving || finalizing || !selectedPeriodId}
                    variant="secondary"
                  >
                    {saving ? 'Menyimpan...' : ba ? 'Perbarui Draft' : 'Buat Draft BA'}
                  </ActionButton>
                  {ba && (
                    <ActionButton
                      icon={finalizing ? Loader2 : CheckCircle2}
                      onClick={handleFinalize}
                      disabled={saving || finalizing}
                    >
                      {finalizing ? 'Memfinalisasi...' : 'Finalisasi BA'}
                    </ActionButton>
                  )}
                </div>
                {ba && (
                  <p className="text-xs text-muted-foreground">
                    Finalisasi BA bersifat permanen. Pastikan semua data tindak lanjut sudah lengkap sebelum finalisasi.
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {isFinalized && (
            <SectionCard title="BA Sudah Difinalisasi">
              <p className="text-sm text-muted-foreground">
                Berita Acara telah difinalisasi pada {ba?.finalizedAt ? formatDateTime(ba.finalizedAt) : '-'}.
                Untuk rekonsiliasi periode berikutnya, buat periode baru dan jalankan proses dari awal.
              </p>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
