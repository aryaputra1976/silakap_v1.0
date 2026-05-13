import { StatusBadge } from '@/components/workspace/ui';
import type { DmsDocumentCategory } from '@/lib/api/dms';
import { dmsCategoryLabel } from '@/lib/api/dms';
import { getDmsCategoryTone } from './shared/dms-category-utils';

export function DmsCategoryBadge({
  category,
}: {
  category: DmsDocumentCategory | string | null | undefined;
}) {
  const normalized = category ?? 'LAINNYA';

  return (
    <StatusBadge
      value={dmsCategoryLabel(normalized)}
      tone={getDmsCategoryTone(normalized)}
    />
  );
}