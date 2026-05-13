import { SectionCard } from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';

export function DmsDocumentRelationsCard({
  document,
}: {
  document: DmsDocument;
}) {
  return (
    <SectionCard
      title="Relasi Dokumen"
      description="Koneksi dokumen dengan data ASN, unit kerja, case, atau worklog."
    >
      <div className="grid gap-3 text-sm">
        <Meta label="Unit Kerja" value={document.unitKerja?.nama ?? '-'} />
        <Meta label="Kode Unit" value={document.unitKerja?.kode ?? '-'} />
        <Meta label="ASN" value={document.asn?.nama ?? '-'} />
        <Meta label="NIP" value={document.asn?.nip ?? '-'} />
        <Meta label="Case SIAP" value={document.case?.caseNumber ?? '-'} />
        <Meta label="Worklog" value={document.worklog?.title ?? '-'} />
        <Meta label="Pembuat" value={document.createdBy?.name ?? '-'} />
        <Meta label="Verifikator" value={document.verifiedBy?.name ?? '-'} />
      </div>
    </SectionCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-zinc-50/60 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-zinc-900">
        {value}
      </div>
    </div>
  );
}
