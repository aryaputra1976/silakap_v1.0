import { DmsDocumentCategory } from '@prisma/client';

export const DMS_DOCUMENT_CATEGORIES = [
  DmsDocumentCategory.SKP,
  DmsDocumentCategory.LAPORAN_BULANAN,
  DmsDocumentCategory.LAPORAN_TRIWULAN,
  DmsDocumentCategory.LAPORAN_TAHUNAN,
  DmsDocumentCategory.REKON_DATA,
  DmsDocumentCategory.DATA_ASN,
  DmsDocumentCategory.SURAT_DINAS,
  DmsDocumentCategory.NOTA_DINAS,
  DmsDocumentCategory.BUKTI_DUKUNG,
  DmsDocumentCategory.DOKUMEN_KEBIJAKAN,
  DmsDocumentCategory.ARSIP_KEPEGAWAIAN,
  DmsDocumentCategory.LAINNYA,
] as const;

export function isDmsDocumentCategory(value: unknown): value is DmsDocumentCategory {
  return (
    typeof value === 'string' &&
    DMS_DOCUMENT_CATEGORIES.includes(value as DmsDocumentCategory)
  );
}
