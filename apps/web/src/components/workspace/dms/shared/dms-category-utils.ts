import type { DmsBadgeTone } from './dms-status-utils';

export function getDmsCategoryTone(category: string): DmsBadgeTone {
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

  return 'neutral';
}
