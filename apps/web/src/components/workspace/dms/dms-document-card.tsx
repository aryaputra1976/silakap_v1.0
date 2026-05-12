import { Eye, FileText } from 'lucide-react';
import {
  ActionButton,
  formatDateTime,
  formatFileSize,
  SectionCard,
} from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';
import { DmsCategoryBadge } from './dms-category-badge';
import { DmsStatusBadge } from './dms-status-badge';

export function DmsDocumentCard({
  document,
  onOpen,
}: {
  document: DmsDocument;
  onOpen?: (id: string) => void;
}) {
  return (
    <SectionCard className="h-full">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
            <FileText className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold text-zinc-950">
              {document.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
              {document.description ?? 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DmsCategoryBadge category={document.category} />
          <DmsStatusBadge status={document.status} />
        </div>

        <div className="grid gap-2 text-sm">
          <Meta label="Unit Kerja" value={document.unitKerja?.nama ?? '-'} />
          <Meta label="ASN" value={document.asn?.nama ?? '-'} />
          <Meta
            label="File"
            value={document.originalFileName ?? document.fileName ?? 'Belum upload'}
          />
          <Meta label="Ukuran" value={formatFileSize(document.fileSize)} />
          <Meta label="Dibuat" value={formatDateTime(document.createdAt)} />
        </div>

        {onOpen ? (
          <ActionButton
            icon={Eye}
            onClick={() => onOpen(document.id)}
            variant="secondary"
          >
            Buka Dokumen
          </ActionButton>
        ) : null}
      </div>
    </SectionCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-zinc-900">
        {value}
      </span>
    </div>
  );
}