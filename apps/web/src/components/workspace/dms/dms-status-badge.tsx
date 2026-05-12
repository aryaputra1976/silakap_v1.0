import { StatusBadge } from '@/components/workspace/ui';
import type { DmsDocumentStatus } from '@/lib/api/dms';
import { dmsStatusLabel } from '@/lib/api/dms';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

export function DmsStatusBadge({
  status,
}: {
  status: DmsDocumentStatus | string | null | undefined;
}) {
  const normalized = status ?? 'DRAFT';

  return (
    <StatusBadge
      value={dmsStatusLabel(normalized)}
      tone={getDmsStatusTone(normalized)}
    />
  );
}

function getDmsStatusTone(status: string): BadgeTone {
  if (status === 'VERIFIED' || status === 'ARCHIVED') {
    return 'success';
  }

  if (status === 'SUBMITTED') {
    return 'info';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  if (status === 'UPLOADED') {
    return 'warning';
  }

  return 'neutral';
}