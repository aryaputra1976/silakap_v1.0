import { useState } from 'react';
import {
  ActionButton,
  ErrorAlert,
  FileMeta,
  SectionCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';
import { CheckCircle2, Loader2, Archive, XCircle } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { rhkCandidatesApi } from '@/lib/api/kinerja-rhk-candidates';
import type { KinerjaRhkCandidate } from '@/lib/kinerja-rhk-candidates/types';
import type { KinerjaRhkPeriodType } from '@/lib/kinerja-rhk-realizations/types';
import {
  formatScore,
  rhkCandidateStatusLabel,
  rhkCandidateStatusTone,
} from '@/lib/kinerja-rhk-candidates/types';
import type { AppRole } from '@/lib/rbac/roles';

const APPROVE_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

export function RhkCandidateDetailPanel({
  candidate: initial,
  role,
  onUpdated,
}: {
  candidate: KinerjaRhkCandidate;
  role: AppRole;
  onUpdated?: (updated: KinerjaRhkCandidate) => void;
}) {
  const [candidate, setCandidate] = useState(initial);
  const [note, setNote] = useState('');
  const [periodType, setPeriodType] = useState<KinerjaRhkPeriodType>('MONTHLY');
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodQuarter, setPeriodQuarter] = useState(String(Math.floor(new Date().getMonth() / 3) + 1));
  const [loading, setLoading] = useState<'approve' | 'reject' | 'archive' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canAct = APPROVE_ROLES.includes(role) && candidate.status === 'CANDIDATE';

  async function handleApprove() {
    setLoading('approve');
    setError('');
    setSuccess('');
    try {
      const updated = await rhkCandidatesApi.approve(candidate.id, {
        note: note || undefined,
        periodType,
        periodYear: Number(periodYear),
        periodMonth: periodType === 'MONTHLY' ? Number(periodMonth) : undefined,
        periodQuarter: periodType === 'QUARTERLY' ? Number(periodQuarter) : undefined,
      });
      if (updated) {
        setCandidate(updated);
        setSuccess('Kandidat RHK berhasil disetujui.');
        setNote('');
        onUpdated?.(updated);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menyetujui kandidat');
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!note.trim()) {
      setError('Catatan penolakan wajib diisi.');
      return;
    }
    setLoading('reject');
    setError('');
    setSuccess('');
    try {
      const updated = await rhkCandidatesApi.reject(candidate.id, { note });
      if (updated) {
        setCandidate(updated);
        setSuccess('Kandidat RHK berhasil ditolak.');
        setNote('');
        onUpdated?.(updated);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menolak kandidat');
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    setLoading('archive');
    setError('');
    setSuccess('');
    try {
      const updated = await rhkCandidatesApi.archive(candidate.id, note ? { note } : {});
      if (updated) {
        setCandidate(updated);
        setSuccess('Kandidat RHK berhasil diarsipkan.');
        setNote('');
        onUpdated?.(updated);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal mengarsipkan kandidat');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Detail Kandidat RHK"
        description="Data kandidat realisasi kinerja bidang dari layanan OPD yang selesai."
      >
        {error ? <ErrorAlert message={error} /> : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FileMeta label="Judul Layanan" value={candidate.title} />
          <FileMeta label="Modul" value={candidate.moduleKey} />
          <FileMeta label="Tipe Layanan" value={candidate.serviceType} />
          <FileMeta label="OPD" value={candidate.opdName ?? '—'} />
          <FileMeta label="Nama Subjek" value={candidate.subjectName ?? '—'} />
          <FileMeta label="NIP" value={candidate.subjectNip ?? '—'} />
          <FileMeta
            label="Kode RHK"
            value={candidate.rhkCode ? <StatusBadge value={candidate.rhkCode} tone="info" /> : '—'}
          />
          <FileMeta
            label="Kode SOP"
            value={candidate.sopCode ? <StatusBadge value={candidate.sopCode} tone="neutral" /> : '—'}
          />
          <FileMeta
            label="Status"
            value={
              <StatusBadge
                value={rhkCandidateStatusLabel(candidate.status)}
                tone={rhkCandidateStatusTone(candidate.status)}
              />
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Skor Kualitas Layanan">
        <div className="grid gap-3 sm:grid-cols-4">
          <FileMeta
            label="Skor Keseluruhan"
            value={
              <span className="text-lg font-bold text-[#18343a]">
                {formatScore(candidate.overallScore)}
              </span>
            }
          />
          <FileMeta label="Kualitas (Checklist)" value={formatScore(candidate.qualityScore)} />
          <FileMeta
            label="Ketepatan Waktu"
            value={
              <StatusBadge
                value={formatScore(candidate.timeScore)}
                tone={candidate.timeScore === 100 ? 'success' : 'warning'}
              />
            }
          />
          <FileMeta label="Kelengkapan Bukti" value={formatScore(candidate.evidenceScore)} />
        </div>
        <p className="mt-3 text-xs text-[#6d7e68]">
          Formula: Kualitas(40%) + Waktu(30%) + Bukti(30%)
        </p>
      </SectionCard>

      {candidate.status === 'APPROVED' ? (
        <SectionCard title="Info Persetujuan">
          <div className="grid gap-3 sm:grid-cols-2">
            <FileMeta label="Disetujui oleh" value={candidate.approvedByRole ?? candidate.approvedById ?? '—'} />
            <FileMeta label="Waktu persetujuan" value={formatDateTime(candidate.approvedAt)} />
            {candidate.approvalNote ? (
              <FileMeta label="Catatan" value={candidate.approvalNote} />
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {candidate.status === 'REJECTED' ? (
        <SectionCard title="Info Penolakan">
          <div className="grid gap-3 sm:grid-cols-2">
            <FileMeta label="Ditolak oleh" value={candidate.rejectedByRole ?? candidate.rejectedById ?? '—'} />
            <FileMeta label="Waktu penolakan" value={formatDateTime(candidate.rejectedAt)} />
            {candidate.rejectionNote ? (
              <FileMeta label="Alasan penolakan" value={candidate.rejectionNote} />
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {canAct ? (
        <SectionCard
          title="Validasi Kandidat"
          description="Setujui atau tolak kandidat ini sebagai realisasi RHK bidang."
        >
          <div className="space-y-3">
            <textarea
              className="w-full rounded-md border border-[#cfe1da] bg-white px-3 py-2 text-sm text-[#18343a] outline-none focus:border-[#0e7c86] focus:ring-2 focus:ring-[#8fd8df]"
              placeholder="Catatan validasi (wajib untuk Tolak)..."
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-[#18343a]">Tipe periode</span>
                <select
                  className="h-10 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
                  value={periodType}
                  onChange={(event) => setPeriodType(event.target.value as KinerjaRhkPeriodType)}
                >
                  <option value="MONTHLY">Bulanan</option>
                  <option value="QUARTERLY">Triwulan</option>
                  <option value="YEARLY">Tahunan</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-[#18343a]">Tahun</span>
                <input
                  className="h-10 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
                  inputMode="numeric"
                  value={periodYear}
                  onChange={(event) => setPeriodYear(event.target.value)}
                />
              </label>
              {periodType === 'MONTHLY' ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-[#18343a]">Bulan</span>
                  <select
                    className="h-10 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
                    value={periodMonth}
                    onChange={(event) => setPeriodMonth(event.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {periodType === 'QUARTERLY' ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-[#18343a]">Triwulan</span>
                  <select
                    className="h-10 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
                    value={periodQuarter}
                    onChange={(event) => setPeriodQuarter(event.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={loading === 'approve' ? Loader2 : CheckCircle2}
                variant="primary"
                disabled={Boolean(loading)}
                onClick={() => void handleApprove()}
              >
                Setujui
              </ActionButton>
              <ActionButton
                icon={loading === 'reject' ? Loader2 : XCircle}
                variant="danger"
                disabled={Boolean(loading) || !note.trim()}
                onClick={() => void handleReject()}
              >
                Tolak
              </ActionButton>
              <ActionButton
                icon={loading === 'archive' ? Loader2 : Archive}
                variant="secondary"
                disabled={Boolean(loading)}
                onClick={() => void handleArchive()}
              >
                Arsipkan
              </ActionButton>
            </div>
            <p className="text-xs text-[#6d7e68]">
              Tolak aktif setelah catatan diisi. Penolakan memerlukan alasan yang jelas.
            </p>
          </div>
        </SectionCard>
      ) : null}

      {candidate.auditLogs.length > 0 ? (
        <SectionCard title="Riwayat Audit">
          <div className="space-y-2">
            {candidate.auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-[#e5ede0] bg-[#f9fdf6] p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#18343a]">{log.action}</span>
                  <span className="text-xs text-[#6d7e68]">{formatDateTime(log.createdAt)}</span>
                </div>
                {log.actorRole ? (
                  <div className="mt-0.5 text-xs text-[#6d7e68]">{log.actorRole}</div>
                ) : null}
                {log.note ? (
                  <p className="mt-1 text-xs text-[#51614c]">{log.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
