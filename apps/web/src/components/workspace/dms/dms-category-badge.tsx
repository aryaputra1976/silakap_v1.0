import { StatusBadge } from '@/components/workspace/ui';
import type { DmsDocumentCategory } from '@/lib/api/dms';
import { dmsCategoryLabel } from '@/lib/api/dms';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

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

function getDmsCategoryTone(category: string): BadgeTone {
  if (
    category === 'SKP' ||
    category === 'DOKUMEN_KEBIJAKAN' ||
    category === 'ARSIP_KEPEGAWAIAN'
  ) {
    return 'dark';
  }

  if (
    category === 'LAPORAN_BULANAN' ||
    category === 'LAPORAN_TRIWULAN' ||
    category === 'LAPORAN_TAHUNAN'
  ) {
    return 'info';
  }

  if (category === 'REKON_DATA' || category === 'DATA_ASN') {
    return 'success';
  }

  if (category === 'SURAT_DINAS' || category === 'NOTA_DINAS') {
    return 'warning';
  }

  if (category === 'BUKTI_DUKUNG') {
    return 'neutral';
  }

  return 'neutral';
}