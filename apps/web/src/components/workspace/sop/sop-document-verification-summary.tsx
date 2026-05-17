import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileQuestion,
  FileText,
  Link2,
  Unlink,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { SopDocumentVerificationSummary as SummaryValue } from '@/lib/api/sop-document-verification';

export function SopDocumentVerificationSummary({ summary }: { summary: SummaryValue }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Dokumen"
        value={summary.totalDocuments}
        description="Dokumen DMS yang terbaca sesuai filter."
        icon={FileText}
        tone="info"
      />
      <StatCard
        label="ASN Terbaca"
        value={summary.totalAsn}
        description="Jumlah ASN yang memiliki dokumen terkait asnId."
        icon={Users}
        tone="dark"
      />
      <StatCard
        label="Dokumen Verified"
        value={summary.verifiedDocuments}
        description="Dokumen yang sudah terverifikasi di DMS."
        icon={CheckCircle2}
        tone="success"
      />
      <StatCard
        label="Dokumen Ditolak"
        value={summary.rejectedDocuments}
        description="Dokumen yang perlu perbaikan."
        icon={AlertTriangle}
        tone="danger"
      />
      <StatCard
        label="Uploaded/Submitted"
        value={summary.uploadedOrSubmittedDocuments}
        description="Dokumen menunggu proses lanjutan."
        icon={FileCheck2}
        tone="warning"
      />
      <StatCard
        label="Tanpa File"
        value={summary.documentsWithoutFile}
        description="Metadata dokumen ada, tetapi file belum tersedia."
        icon={FileQuestion}
        tone="warning"
      />
      <StatCard
        label="Terkait ASN"
        value={summary.documentsLinkedToAsn}
        description="Dokumen yang memiliki asnId."
        icon={Link2}
        tone="success"
      />
      <StatCard
        label="Belum Terkait ASN"
        value={summary.documentsWithoutAsn}
        description="Dokumen belum memiliki relasi asnId."
        icon={Unlink}
        tone="neutral"
      />
    </div>
  );
}
