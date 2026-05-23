import {
  Archive,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileCheck,
  FileText,
  FolderArchive,
  Gauge,
  GitCompareArrows,
  GitBranch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import { MenuConfig } from '@/config/types';
import {
  ADMIN_ROLES,
  EXECUTIVE_ROLES,
} from '@/lib/rbac/policies';

export const MENU_SIDEBAR: MenuConfig = [
  { heading: 'Workspace' },
  {
    title: 'Dashboard',
    icon: Gauge,
    path: '/dashboard',
    moduleKey: 'DASHBOARD',
  },
  {
    title: 'Inti SIAP',
    icon: GitBranch,
    moduleKey: 'SIAP',
    children: [
      {
        title: 'Dashboard Pimpinan',
        path: '/siap/worklogs/executive',
        icon: ShieldAlert,
        moduleKey: 'SIAP',
        requiredPermission: 'monitor',
        allowedRoles: EXECUTIVE_ROLES,
      },
      {
        title: 'Dashboard Buku Kerja',
        path: '/siap/worklogs/dashboard',
        icon: BarChart3,
        moduleKey: 'SIAP',
        requiredPermission: 'monitor',
      },
      {
        title: 'Tugas SIAP',
        path: '/siap/tasks',
        moduleKey: 'SIAP',
      },
      {
        title: 'Buku Kerja Saya',
        path: '/siap/worklogs',
        icon: BookOpenCheck,
        moduleKey: 'SIAP',
      },
      {
        title: 'Tinjau Buku Kerja',
        path: '/siap/worklogs/team',
        icon: ClipboardCheck,
        moduleKey: 'SIAP',
        requiredPermission: 'review',
      },
      {
        title: 'Disposisi & Arahan',
        path: '/siap/tasks?type=DISPOSISI',
        moduleKey: 'SIAP',
      },
      {
        title: 'Tindak Lanjut',
        path: '/siap/tasks?status=FOLLOW_UP',
        moduleKey: 'SIAP',
        requiredPermission: 'input',
      },
    ],
  },
  {
    title: 'Kinerja Bidang',
    icon: BarChart3,
    moduleKey: 'KINERJA_BIDANG',
    children: [
      {
        title: 'Dashboard Kinerja',
        path: '/kinerja-bidang',
        moduleKey: 'KINERJA_BIDANG',
      },
      {
        title: 'Rencana Kerja Bidang',
        path: '/kinerja-bidang/sop?stage=TAHAP_1',
        moduleKey: 'KINERJA_BIDANG',
      },
      {
        title: 'Target RHK',
        path: '/kinerja-bidang/targets',
        moduleKey: 'KINERJA_BIDANG',
        requiredPermission: 'monitor',
      },
      {
        title: 'Realisasi Bulanan',
        path: '/kinerja-bidang/realizations',
        moduleKey: 'KINERJA_BIDANG',
        requiredPermission: 'input',
      },
      {
        title: 'Monitoring Kegiatan',
        path: '/kinerja-bidang/monitoring-kegiatan',
        moduleKey: 'KINERJA_BIDANG',
        requiredPermission: 'monitor',
      },
      {
        title: 'Laporan Kinerja',
        path: '/kinerja-bidang/report',
        moduleKey: 'KINERJA_BIDANG',
        requiredPermission: 'report',
      },
      {
        title: 'Bukti Dukung RHK',
        path: '/dms/documents?category=BUKTI_DUKUNG',
        moduleKey: 'DMS',
      },
    ],
  },
  {
    title: 'Layanan Kepegawaian',
    icon: ClipboardCheck,
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    children: [
      {
        title: 'Permohonan Masuk',
        path: '/layanan',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
      },
      {
        title: 'Meja Kerja Verifikasi',
        path: '/layanan/workbench',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'verify',
      },
      {
        title: 'Verifikasi Berkas',
        path: '/layanan/verifikasi',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'verify',
      },
      {
        title: 'Monitoring SLA',
        path: '/layanan/sla',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Keterlambatan Layanan',
        path: '/layanan/keterlambatan',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Evaluasi Kepuasan',
        path: '/layanan/kepuasan',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Rekap Layanan',
        path: '/layanan/laporan',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'report',
      },
    ],
  },
  {
    title: 'IKM Survei Kepuasan',
    icon: ThumbsUp,
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    children: [
      {
        title: 'Hasil & Rekap IKM',
        path: '/layanan/kepuasan',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Manajemen Periode IKM',
        path: '/layanan/ikm/periode',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'verify',
      },
      {
        title: 'Data Survei Masuk',
        path: '/layanan/ikm/data',
        moduleKey: 'LAYANAN_KEPEGAWAIAN',
        requiredPermission: 'monitor',
      },
    ],
  },
  {
    title: 'SIDATA ASN',
    icon: Database,
    moduleKey: 'SIDATA',
    children: [
      // ── Semua role SIDATA ────────────────────────────────────────────
      { title: 'Dashboard', path: '/sidata/dashboard', moduleKey: 'SIDATA' },
      // ── Data ASN: parent read, child masing-masing filter permission ─
      {
        title: 'Data ASN',
        moduleKey: 'SIDATA',
        children: [
          { title: 'Profil ASN', path: '/sidata/asn', moduleKey: 'SIDATA' },
          { title: 'Rekapitulasi ASN', path: '/sidata/rekap', moduleKey: 'SIDATA' },
          {
            title: 'Validasi Data',
            path: '/sidata/validasi',
            moduleKey: 'SIDATA',
            requiredPermission: 'verify',
          },
          {
            title: 'Pemutakhiran',
            path: '/sidata/pemutakhiran',
            moduleKey: 'SIDATA',
            requiredPermission: 'input',
          },
        ],
      },
      // ── Import: parent read, child filter upload/monitor ─────────────
      {
        title: 'Import & Sinkronisasi',
        moduleKey: 'SIDATA',
        children: [
          {
            title: 'Import Data',
            path: '/sidata/import/siasn',
            moduleKey: 'SIDATA',
            requiredPermission: 'upload',
          },
          {
            title: 'Riwayat & Log',
            path: '/sidata/import/riwayat',
            moduleKey: 'SIDATA',
            requiredPermission: 'monitor',
          },
        ],
      },
      // ── Referensi: semua role SIDATA ─────────────────────────────────
      { title: 'Referensi Data', path: '/sidata/referensi', moduleKey: 'SIDATA' },
      // ── Rekonsiliasi: verify ke atas; Discrepancy sebagai tab di dalam halaman
      {
        title: 'Rekonsiliasi',
        path: '/sidata/rekonsiliasi',
        moduleKey: 'SIDATA',
        requiredPermission: 'verify',
      },
      // ── Arsip Bulanan: monitor dan upload ────────────────────────────
      {
        title: 'Arsip Bulanan ASN',
        path: '/sidata/arsip',
        moduleKey: 'SIDATA',
        requiredPermission: 'monitor',
      },
      // ── Gaji Pokok PNS ───────────────────────────────────────────────
      {
        title: 'Gaji Pokok PNS',
        path: '/sidata/gaji-pokok',
        moduleKey: 'SIDATA',
      },
      // ── Dokumen & Laporan: parent read, child filter report ──────────
      {
        title: 'Dokumen & Laporan',
        moduleKey: 'SIDATA',
        children: [
          { title: 'Dokumen ASN', path: '/sidata/dokumen', moduleKey: 'SIDATA' },
          {
            title: 'Laporan',
            path: '/sidata/laporan',
            moduleKey: 'SIDATA',
            requiredPermission: 'report',
          },
        ],
      },
    ],
  },
  {
    title: 'Rekonsiliasi BPKAD',
    icon: GitCompareArrows,
    moduleKey: 'REKONSILIASI_BPKAD',
    children: [
      {
        title: 'Dashboard',
        path: '/rekonsiliasi-bpkad/dashboard',
        moduleKey: 'REKONSILIASI_BPKAD',
      },
      {
        title: 'Manajemen Periode',
        path: '/rekonsiliasi-bpkad/periode',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'verify',
      },
      {
        title: 'Import Simgaji',
        path: '/rekonsiliasi-bpkad/import/simgaji',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'upload',
      },
      {
        title: 'Pencocokan Data',
        path: '/rekonsiliasi-bpkad/matching',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'verify',
      },
      {
        title: 'Matriks Temuan',
        path: '/rekonsiliasi-bpkad/temuan',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'verify',
      },
      {
        title: 'Tindak Lanjut',
        path: '/rekonsiliasi-bpkad/tindak-lanjut',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'input',
      },
      {
        title: 'Berita Acara',
        path: '/rekonsiliasi-bpkad/berita-acara',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'approve',
      },
      {
        title: 'Laporan',
        path: '/rekonsiliasi-bpkad/laporan',
        moduleKey: 'REKONSILIASI_BPKAD',
        requiredPermission: 'report',
      },
    ],
  },
  {
    title: 'DMS Bukti Dukung',
    icon: FolderArchive,
    moduleKey: 'DMS',
    children: [
      { title: 'Dashboard DMS', path: '/dms', moduleKey: 'DMS' },
      {
        title: 'Dokumen SOP',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN',
        moduleKey: 'DMS',
      },
      {
        title: 'Bukti Dukung RHK',
        path: '/dms/documents?category=BUKTI_DUKUNG',
        moduleKey: 'DMS',
      },
      {
        title: 'Dokumen Layanan',
        path: '/dms/documents?category=ARSIP_KEPEGAWAIAN',
        moduleKey: 'DMS',
      },
      {
        title: 'Dokumen Keputusan',
        path: '/dms/documents?category=SURAT_DINAS',
        moduleKey: 'DMS',
      },
      {
        title: 'Upload Dokumen',
        path: '/dms/upload',
        moduleKey: 'DMS',
        requiredPermission: 'upload',
      },
      {
        title: 'Verifikasi Dokumen',
        path: '/dms/verification',
        moduleKey: 'DMS',
        requiredPermission: 'verify',
      },
      {
        title: 'Laporan DMS',
        path: '/dms/reports',
        moduleKey: 'DMS',
        requiredPermission: 'report',
      },
    ],
  },
  {
    title: 'SIPENSIUN',
    icon: FileText,
    moduleKey: 'SIPENSIUN',
    children: [
      {
        title: 'Dashboard',
        path: '/sipensiun?view=dashboard',
        moduleKey: 'SIPENSIUN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Usulan Pensiun',
        moduleKey: 'SIPENSIUN',
        children: [
          {
            title: 'Penerimaan Usulan',
            path: '/sipensiun?view=received',
            moduleKey: 'SIPENSIUN',
            requiredPermission: 'input',
          },
          {
            title: 'Verifikasi Berkas',
            path: '/sipensiun?view=verification',
            moduleKey: 'SIPENSIUN',
            requiredPermission: 'verify',
          },
          { title: 'BUP', path: '/sipensiun?jenis=BUP', moduleKey: 'SIPENSIUN' },
          {
            title: 'Ahli Waris',
            path: '/sipensiun?jenis=AHLI_WARIS',
            moduleKey: 'SIPENSIUN',
          },
        ],
      },
      {
        title: 'Pemberhentian ASN',
        moduleKey: 'PEMBERHENTIAN',
        children: [
          {
            title: 'Monitoring BUP',
            path: '/pemberhentian/monitoring',
            moduleKey: 'PEMBERHENTIAN',
            requiredPermission: 'monitor',
          },
          {
            title: 'Proses Pemberhentian',
            path: '/pemberhentian/proses',
            moduleKey: 'PEMBERHENTIAN',
            requiredPermission: 'read',
          },
        ],
      },
      {
        title: 'Monitoring Status',
        path: '/sipensiun?view=monitoring',
        moduleKey: 'SIPENSIUN',
        requiredPermission: 'monitor',
      },
      {
        title: 'Penyerahan Keputusan',
        path: '/sipensiun?view=decision-delivery',
        moduleKey: 'SIPENSIUN',
        requiredPermission: 'input',
      },
      {
        title: 'Update Data Setelah SK',
        path: '/sipensiun?view=data-update',
        moduleKey: 'SIPENSIUN',
        requiredPermission: 'input',
      },
      {
        title: 'Laporan',
        path: '/sipensiun?view=reports',
        moduleKey: 'SIPENSIUN',
        requiredPermission: 'report',
      },
    ],
  },
  {
    title: 'SIFORMEN',
    icon: Building2,
    moduleKey: 'SIFORMEN',
    children: [
      {
        title: 'Dashboard SIFORMEN',
        path: '/siformen',
        icon: Gauge,
        moduleKey: 'SIFORMEN',
      },
      {
        title: 'Peta Jabatan',
        path: '/siformen/jabatan',
        icon: Building2,
        moduleKey: 'SIFORMEN',
        requiredPermission: 'read',
      },
      {
        title: 'Ref. Jabatan Fungsional',
        path: '/siformen/jabatan-fungsional-ref',
        icon: BookOpen,
        moduleKey: 'SIFORMEN',
        requiredPermission: 'read',
      },
      {
        title: 'Analisis Beban Kerja',
        path: '/siformen/abk',
        icon: TrendingUp,
        moduleKey: 'SIFORMEN',
        requiredPermission: 'read',
      },
      {
        title: 'Bezetting Jabatan',
        path: '/siformen/bezetting',
        icon: Users,
        moduleKey: 'SIFORMEN',
        requiredPermission: 'read',
      },
      {
        title: 'Usulan Formasi',
        path: '/siformen/formasi',
        icon: FileCheck,
        moduleKey: 'SIFORMEN',
        requiredPermission: 'read',
      },
    ],
  },
  { heading: 'Control' },
  {
    title: 'Kalender Kerja',
    icon: CalendarDays,
    path: '/working-calendar',
    moduleKey: 'WORKING_CALENDAR',
  },
  {
    title: 'SIARSIP',
    icon: Archive,
    path: '/siarsip',
    moduleKey: 'SIARSIP',
  },
  {
    title: 'SIANALITIK',
    icon: BarChart3,
    path: '/sianalitik',
    moduleKey: 'SIANALITIK',
  },
  {
    title: 'Referensi SOP',
    icon: FileText,
    moduleKey: 'DMS',
    children: [
      {
        title: 'SOP Tahap 1 - Manajemen Bidang',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_1',
        moduleKey: 'DMS',
      },
      {
        title: 'SOP Tahap 2 - Layanan Kepegawaian',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
        moduleKey: 'DMS',
      },
      {
        title: 'SOP Tahap 3 - Fungsi PPIK',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3',
        moduleKey: 'DMS',
      },
      {
        title: 'SOP Pensiun & Pemberhentian',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN',
        moduleKey: 'DMS',
      },
      {
        title: 'Matriks SOP + Form + DMS',
        path: '/dms/documents?category=DOKUMEN_KEBIJAKAN&subCategory=SOP_MATRIKS',
        moduleKey: 'DMS',
      },
    ],
  },
  {
    title: 'RBAC',
    icon: ShieldCheck,
    path: '/admin/rbac',
    moduleKey: 'ADMIN',
    requiredPermission: 'admin',
    allowedRoles: ADMIN_ROLES,
  },
  {
    title: 'Pengguna',
    icon: Users,
    path: '/admin/users',
    moduleKey: 'ADMIN',
    requiredPermission: 'admin',
    allowedRoles: ADMIN_ROLES,
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    path: '/admin/settings',
    moduleKey: 'ADMIN',
    requiredPermission: 'admin',
    allowedRoles: ADMIN_ROLES,
  },
];

export const MENU_MEGA: MenuConfig = MENU_SIDEBAR.filter((item) => !item.heading);
export const MENU_MEGA_MOBILE: MenuConfig = MENU_MEGA;
