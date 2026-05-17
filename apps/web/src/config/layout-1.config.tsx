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
      { title: 'Disposisi & Arahan', path: '/siap/tasks?type=DISPOSISI' },
      { title: 'Tindak Lanjut', path: '/siap/tasks?status=FOLLOW_UP' },
    ],
  },
  {
    title: 'Kinerja Bidang',
    icon: BarChart3,
    children: [
      { title: 'Dashboard Kinerja', path: '/siap/worklogs/dashboard' },
      { title: 'Rencana Kerja Bidang', path: '/siap/worklogs?category=RKB' },
      { title: 'Target RHK', path: '/siap/worklogs?category=RHK' },
      { title: 'Realisasi Bulanan', path: '/siap/worklogs' },
      { title: 'Monitoring Kegiatan', path: '/siap/worklogs/team' },
      { title: 'Laporan Kinerja', path: '/siap/worklogs/executive' },
      { title: 'Bukti Dukung RHK', path: '/dms/documents?category=RHK' },
    ],
  },
  {
    title: 'Layanan Kepegawaian',
    icon: ClipboardCheck,
    children: [
      { title: 'Permohonan Masuk', path: '/siap/tasks?scope=LAYANAN' },
      { title: 'Verifikasi Berkas', path: '/siap/tasks?view=verification' },
      { title: 'Monitoring SLA', path: '/siap/tasks?status=OVERDUE' },
      { title: 'Keterlambatan Layanan', path: '/siap/tasks?status=DELAYED' },
      { title: 'Evaluasi Kepuasan', path: '/siap/tasks?view=satisfaction' },
      { title: 'Rekap Layanan', path: '/siap/worklogs/dashboard?scope=LAYANAN' },
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
      { title: 'Discrepancy Data', path: '/sidata/validasi?view=discrepancy' },
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
      { title: 'Dokumen SOP', path: '/dms/documents?category=SOP' },
      { title: 'Bukti Dukung RHK', path: '/dms/documents?category=RHK' },
      { title: 'Dokumen Layanan', path: '/dms/documents?category=LAYANAN' },
      { title: 'Dokumen Keputusan', path: '/dms/documents?category=KEPUTUSAN' },
      { title: 'Upload Dokumen', path: '/dms/upload' },
      { title: 'Verifikasi Dokumen', path: '/dms/verification' },
      { title: 'Laporan DMS', path: '/dms/reports' },
    ],
  },
  {
    title: 'SIPENSIUN',
    icon: FileText,
    children: [
      { title: 'Dashboard', path: '/sipensiun?view=dashboard' },
      {
        title: 'Usulan Pensiun',
        children: [
          { title: 'Penerimaan Usulan', path: '/sipensiun?view=received' },
          { title: 'Verifikasi Berkas', path: '/sipensiun?view=verification' },
          { title: 'BUP', path: '/sipensiun?jenis=BUP' },
          { title: 'Ahli Waris', path: '/sipensiun?jenis=AHLI_WARIS' },
        ],
      },
      {
        title: 'Pemberhentian ASN',
        children: [
          { title: 'Atas Permintaan Sendiri', path: '/sipensiun?jenis=APS' },
          { title: 'Tidak Cakap Jasmani/Rohani', path: '/sipensiun?jenis=TIDAK_CAKAP' },
          { title: 'Meninggal/Tewas/Hilang', path: '/sipensiun?jenis=MENINGGAL_TEWAS_HILANG' },
          { title: 'Disiplin/Hukum', path: '/sipensiun?jenis=DISIPLIN_HUKUM' },
          { title: 'Pemberhentian Sementara', path: '/sipensiun?jenis=SEMENTARA' },
          { title: 'Pengaktifan Kembali', path: '/sipensiun?jenis=AKTIF_KEMBALI' },
          { title: 'Perampingan Organisasi', path: '/sipensiun?jenis=PERAMPINGAN' },
        ],
      },
      { title: 'Monitoring Status', path: '/sipensiun?view=monitoring' },
      { title: 'Penyerahan Keputusan', path: '/sipensiun?view=decision-delivery' },
      { title: 'Update Data Setelah SK', path: '/sipensiun?view=data-update' },
      { title: 'Laporan', path: '/sipensiun?view=reports' },
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
    path: '/dashboard?view=analytics',
  },
  {
    title: 'Referensi SOP',
    icon: FileText,
    children: [
      { title: 'SOP Tahap 1 - Manajemen Bidang', path: '/dms/documents?category=SOP_TAHAP_1' },
      { title: 'SOP Tahap 2 - Layanan Kepegawaian', path: '/dms/documents?category=SOP_TAHAP_2' },
      { title: 'SOP Tahap 3 - Fungsi PPIK', path: '/dms/documents?category=SOP_TAHAP_3' },
      { title: 'SOP Pensiun & Pemberhentian', path: '/dms/documents?category=SOP_PENSIUN_PEMBERHENTIAN' },
      { title: 'Matriks SOP + Form + DMS', path: '/dms/documents?category=SOP_MATRIKS' },
    ],
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
