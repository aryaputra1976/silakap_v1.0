import {
  Archive,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Database,
  FileText,
  FolderArchive,
  Gauge,
  GitBranch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  { heading: 'Workspace' },
  {
    title: 'Dashboard',
    icon: Gauge,
    path: '/dashboard',
  },
  {
    title: 'Inti SIAP',
    icon: GitBranch,
    children: [
      {
        title: 'Dashboard Pimpinan',
        path: '/siap/worklogs/executive',
        icon: ShieldAlert,
      },
      {
        title: 'Dashboard Buku Kerja',
        path: '/siap/worklogs/dashboard',
        icon: BarChart3,
      },
      {
        title: 'Tugas SIAP',
        path: '/siap/tasks',
      },
      {
        title: 'Buku Kerja Saya',
        path: '/siap/worklogs',
        icon: BookOpenCheck,
      },      
      {
        title: 'Tinjau Buku Kerja',
        path: '/siap/worklogs/team',
        icon: ClipboardCheck,
      },
      { title: 'Pemantauan SLA', path: '/siap/tasks?status=OVERDUE' },
      { title: 'Manajemen Kasus', path: '/sipensiun' },
      { title: 'Mesin Alur Kerja', path: '/sipensiun?view=workflow' },
    ],
  },
  {
    title: 'SIDATA ASN',
    icon: Database,
    children: [
      { title: 'Dashboard', path: '/sidata/dashboard' },
      { title: 'Profil ASN', path: '/sidata/asn' },
      { title: 'Validasi Data', path: '/sidata/validasi' },
      { title: 'Pemutakhiran Data', path: '/sidata/pemutakhiran' },
      {
        title: 'Import & Sinkronisasi',
        children: [
          { title: 'Import SIASN', path: '/sidata/import/siasn' },
          { title: 'Import Excel', path: '/sidata/import/excel' },
          { title: 'Import Referensi', path: '/sidata/import/referensi' },
          { title: 'Mapping Referensi', path: '/sidata/import/mapping-referensi' },
          { title: 'Riwayat Import', path: '/sidata/import/riwayat' },
          { title: 'Log Sinkronisasi', path: '/sidata/import/log-sinkronisasi' },
        ],
      },
      { title: 'Rekonsiliasi Data', path: '/sidata/rekonsiliasi' },
      { title: 'Referensi Data', path: '/sidata/referensi' },
      { title: 'Dokumen ASN', path: '/sidata/dokumen' },
      { title: 'Laporan', path: '/sidata/laporan' },
    ],
  },
  {
    title: 'DMS Bukti Dukung',
    icon: FolderArchive,
    children: [
      { title: 'Dashboard DMS', path: '/dms' },
      { title: 'Dokumen', path: '/dms/documents' },
      { title: 'Upload Dokumen', path: '/dms/upload' },
      { title: 'Verifikasi Dokumen', path: '/dms/verification' },
      { title: 'Laporan DMS', path: '/dms/reports' },
    ],
  },
  {
    title: 'SIPENSIUN',
    icon: FileText,
    children: [
      { title: 'Usulan Pensiun', path: '/sipensiun' },
      { title: 'Verifikasi OPD', path: '/sipensiun?view=verification' },
      { title: 'Approval', path: '/sipensiun?view=approval' },
    ],
  },
  { heading: 'Control' },
  {
    title: 'SIARSIP',
    icon: Archive,
    path: '/siarsip',
  },
  {
    title: 'SIANALITIK',
    icon: BarChart3,
    path: '/dashboard',
  },
  {
    title: 'RBAC',
    icon: ShieldCheck,
    disabled: true,
  },
  {
    title: 'Pengguna',
    icon: Users,
    disabled: true,
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    disabled: true,
  },
];

export const MENU_MEGA: MenuConfig = MENU_SIDEBAR.filter((item) => !item.heading);
export const MENU_MEGA_MOBILE: MenuConfig = MENU_MEGA;
