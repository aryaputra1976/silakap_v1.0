import { Archive, CheckCircle2, FileCheck2, FileQuestion, FileText, UploadCloud, XCircle } from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { SopEvidenceSummary as SopEvidenceSummaryValue } from '@/lib/api/sop-evidence';

export function SopEvidenceSummary({ summary }: { summary: SopEvidenceSummaryValue }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Bukti"
        value={summary.total}
        description="Dokumen DMS yang terdeteksi terkait SOP/RHK ini."
        icon={FileText}
        tone="info"
      />
      <StatCard
        label="Terverifikasi"
        value={summary.verified}
        description="Dokumen berstatus verified."
        icon={CheckCircle2}
        tone="success"
      />
      <StatCard
        label="Submitted/Uploaded"
        value={summary.submitted + summary.uploaded}
        description="Dokumen menunggu proses final/verifikasi."
        icon={UploadCloud}
        tone="warning"
      />
      <StatCard
        label="Ditolak"
        value={summary.rejected}
        description="Dokumen perlu perbaikan."
        icon={XCircle}
        tone="danger"
      />
      <StatCard
        label="Dengan File"
        value={summary.withFile}
        description="Dokumen sudah memiliki file."
        icon={FileCheck2}
        tone="success"
      />
      <StatCard
        label="Tanpa File"
        value={summary.withoutFile}
        description="Metadata ada, tetapi file belum diunggah."
        icon={FileQuestion}
        tone="warning"
      />
      <StatCard
        label="Draft"
        value={summary.draft}
        description="Dokumen masih dalam draft."
        icon={FileText}
        tone="neutral"
      />
      <StatCard
        label="Arsip"
        value={summary.archived}
        description="Dokumen sudah diarsipkan."
        icon={Archive}
        tone="dark"
      />
    </div>
  );
}
