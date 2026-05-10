import {
  Archive,
  BarChart3,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Settings,
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
    title: 'SIAP Core',
    icon: GitBranch,
    children: [
      { title: 'Task Engine', path: '/siap/tasks' },
      { title: 'SLA Monitoring', path: '/siap/tasks?status=OVERDUE' },
      { title: 'Case Management', path: '/sipensiun' },
      { title: 'Workflow Engine', path: '/sipensiun' },
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
      { title: 'Verifikasi OPD', path: '/sipensiun' },
      { title: 'Approval', path: '/sipensiun' },
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
