import {
  ClipboardList,
  Database,
  FileText,
  FolderArchive,
  Gauge,
  ThumbsUp,
} from 'lucide-react';
import type { MenuConfig } from '@/config/types';
import type { AppModuleKey } from './policies';
import { normalizeAppRole, type AppRole } from './roles';

const OPD_ALLOWED_MODULE_KEYS: AppModuleKey[] = [
  'LAYANAN_KEPEGAWAIAN',
  'SIPENSIUN',
  'SIDATA',
  'DMS',
];

const OPD_MENU_LABELS: Record<string, string> = {
  Dashboard: 'Dashboard OPD',
  'Layanan Kepegawaian': 'Layanan Saya',
  'Permohonan Masuk': 'Permohonan Saya',
  'Penerimaan Usulan': 'Usulan Pensiun Saya',
  'Pemutakhiran Data': 'Usul Pemutakhiran Data',
  'DMS Bukti Dukung': 'Dokumen Saya',
  'Upload Dokumen': 'Upload Bukti Dukung',
};

export const OPD_MENU_SIDEBAR: MenuConfig = [
  { heading: 'Portal OPD' },
  {
    title: 'Dashboard OPD',
    icon: Gauge,
    path: '/opd/dashboard',
  },
  {
    title: 'Layanan Saya',
    icon: ClipboardList,
    children: [
      { title: 'Ajukan Layanan', path: '/opd/layanan/ajukan' },
      { title: 'Permohonan Saya', path: '/opd/layanan' },
      { title: 'Perbaikan Berkas', path: '/opd/layanan/perbaikan' },
      { title: 'Riwayat Layanan', path: '/opd/layanan/riwayat' },
    ],
  },
  {
    title: 'SIPENSIUN',
    icon: FileText,
    children: [
      { title: 'Ajukan Usulan Pensiun', path: '/opd/sipensiun/ajukan' },
      { title: 'Usulan Pensiun Saya', path: '/opd/sipensiun' },
      { title: 'Perbaikan Berkas Pensiun', path: '/opd/sipensiun/perbaikan' },
      { title: 'Status Usulan Pensiun', path: '/opd/sipensiun/status' },
    ],
  },
  {
    title: 'SIDATA ASN',
    icon: Database,
    children: [
      { title: 'Usul Pemutakhiran Data', path: '/opd/sidata/pemutakhiran' },
      { title: 'Status Pemutakhiran', path: '/opd/sidata/status' },
      { title: 'Dokumen ASN', path: '/opd/sidata/dokumen' },
    ],
  },
  {
    title: 'Dokumen Saya',
    icon: FolderArchive,
    children: [
      { title: 'Upload Bukti Dukung', path: '/opd/dokumen/upload' },
      { title: 'Dokumen Saya', path: '/opd/dokumen' },
      { title: 'Dokumen Perlu Perbaikan', path: '/opd/dokumen/perbaikan' },
    ],
  },
  {
    title: 'Survei Kepuasan',
    icon: ThumbsUp,
    path: '/opd/kepuasan',
  },
];

export function isOpdRole(role: AppRole | string | null | undefined): boolean {
  return normalizeAppRole(role) === 'OPD';
}

export function getOpdMenuLabel(originalTitle: string): string {
  return OPD_MENU_LABELS[originalTitle] ?? originalTitle;
}

export function shouldUseOpdMenu(
  role: AppRole | string | null | undefined,
): boolean {
  return isOpdRole(role);
}

export function getOpdDefaultPath(): string {
  return '/opd/dashboard';
}

export function getOpdAllowedModuleKeys(): AppModuleKey[] {
  return OPD_ALLOWED_MODULE_KEYS;
}
