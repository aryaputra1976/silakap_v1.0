import { Link } from 'react-router-dom';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { DmsDashboardSummary } from '@/lib/api/dms';

interface Props {
  dms: DmsDashboardSummary;
}

export function SianalitikDmsEvidence({ dms }: Props) {
  const verified = dms.verifiedOrArchived;
  const waiting = dms.waitingVerification;
  const rejected = dms.rejected;
  const noFile = dms.withoutFile;
  const total = dms.total;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

  return (
    <SectionCard title="Bukti Dukung DMS" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#91d9bf] bg-[#e4f8ef] p-3 text-center">
          <p className="text-2xl font-bold text-[#12815f]">{verified}</p>
          <p className="mt-0.5 text-xs text-[#12815f]">Terverifikasi</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{waiting}</p>
          <p className="mt-0.5 text-xs text-amber-600">Menunggu Verifikasi</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Tingkat Verifikasi</span>
          <span className="font-semibold text-[#12815f]">{verifiedPct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#12815f] transition-all"
            style={{ width: `${verifiedPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Total dokumen</span>
          <span className="font-medium text-slate-700">{total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Tanpa file</span>
          <span className="font-medium text-slate-700">{noFile}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Ditolak</span>
          <div className="flex items-center gap-1.5">
            {rejected > 0 && <StatusBadge value="Perlu Tindakan" tone="danger" />}
            <span className="font-medium text-slate-700">{rejected}</span>
          </div>
        </div>
      </div>

      {dms.latestDocuments && dms.latestDocuments.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
          <p className="text-xs font-medium text-slate-500">Dokumen Terbaru</p>
          {dms.latestDocuments.slice(0, 3).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{doc.title}</span>
              <StatusBadge value={doc.status} tone="neutral" />
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 pt-2">
        <Link to="/dms" className="text-xs font-medium text-[#12815f] hover:underline">
          Kelola dokumen DMS →
        </Link>
      </div>
    </SectionCard>
  );
}
