import {
  ClipboardList,
  Database,
  FileText,
  FolderArchive,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';

export type OpdRequestStatus =
  | 'DRAFT'
  | 'MENUNGGU_VERIFIKASI'
  | 'PERLU_PERBAIKAN'
  | 'DIVERIFIKASI'
  | 'SELESAI';

export type OpdRequest = {
  id: string;
  nomor: string;
  jenisLayanan: string;
  tanggalPengajuan: string;
  status: OpdRequestStatus;
  catatanTerakhir: string;
  canRevise: boolean;
};

export type OpdDocumentStatus =
  | 'TERUNGGAH'
  | 'PERLU_PERBAIKAN'
  | 'DIVERIFIKASI';

export type OpdDocument = {
  id: string;
  nama: string;
  kategori: string;
  tanggalUnggah: string;
  status: OpdDocumentStatus;
  catatanVerifikator: string;
};

export type OpdSummary = {
  totalPermohonan: number;
  menungguVerifikasi: number;
  perluPerbaikan: number;
  selesai: number;
  dokumenDiunggah: number;
  usulanAktif: number;
};

export type OpdTimelineItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
};

export type OpdServiceCard = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
};

export const emptyOpdSummary: OpdSummary = {
  totalPermohonan: 0,
  menungguVerifikasi: 0,
  perluPerbaikan: 0,
  selesai: 0,
  dokumenDiunggah: 0,
  usulanAktif: 0,
};

export const opdRequests: OpdRequest[] = [];
export const opdDocuments: OpdDocument[] = [];
export const opdTimeline: OpdTimelineItem[] = [];

export const opdServiceCards: OpdServiceCard[] = [
  {
    title: 'Ajukan Layanan',
    description: 'Buat draft permohonan layanan kepegawaian untuk OPD.',
    path: '/opd/layanan/ajukan',
    icon: ClipboardList,
  },
  {
    title: 'Ajukan Usulan Pensiun',
    description: 'Siapkan usulan pensiun ASN beserta dokumen awal.',
    path: '/opd/sipensiun/ajukan',
    icon: FileText,
  },
  {
    title: 'Usul Pemutakhiran Data',
    description: 'Kirim usulan perubahan data ASN dengan bukti dukung.',
    path: '/opd/sidata/pemutakhiran',
    icon: Database,
  },
  {
    title: 'Upload Bukti Dukung',
    description: 'Unggah dokumen pendukung untuk permohonan OPD.',
    path: '/opd/dokumen/upload',
    icon: UploadCloud,
  },
  {
    title: 'Dokumen Saya',
    description: 'Pantau dokumen OPD yang terunggah dan statusnya.',
    path: '/opd/dokumen',
    icon: FolderArchive,
  },
];

export function filterRequestsByStatus(
  requests: OpdRequest[],
  status?: OpdRequestStatus,
): OpdRequest[] {
  if (!status) {
    return requests;
  }

  return requests.filter((request) => request.status === status);
}

export function filterDocumentsByStatus(
  documents: OpdDocument[],
  status?: OpdDocumentStatus,
): OpdDocument[] {
  if (!status) {
    return documents;
  }

  return documents.filter((document) => document.status === status);
}
