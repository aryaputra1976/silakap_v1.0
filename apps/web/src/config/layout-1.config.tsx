import {
  Archive,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Database,
  FileText,
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
    title: 'SIDATA',
    icon: Database,
    children: [
      { title: 'ASN', path: '/sidata/asn' },
      { title: 'Unit Organisasi', disabled: true },
      { title: 'Jabatan & Golongan', disabled: true },
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
