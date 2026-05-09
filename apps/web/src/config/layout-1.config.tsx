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
    path: '/',
  },
  {
    title: 'SIAP Core',
    icon: GitBranch,
    children: [
      { title: 'Case Management', path: '/workspace' },
      { title: 'Workflow Engine', path: '/workspace' },
      { title: 'Task Engine', path: '/workspace' },
      { title: 'SLA & Audit', path: '/workspace' },
    ],
  },
  {
    title: 'SIDATA',
    icon: Database,
    children: [
      { title: 'ASN', path: '/workspace' },
      { title: 'Unit Organisasi', path: '/workspace' },
      { title: 'Jabatan & Golongan', path: '/workspace' },
    ],
  },
  {
    title: 'SIPENSIUN',
    icon: FileText,
    children: [
      { title: 'Usulan Pensiun', path: '/workspace' },
      { title: 'Verifikasi OPD', path: '/workspace' },
      { title: 'Approval', path: '/workspace' },
    ],
  },
  { heading: 'Control' },
  {
    title: 'SIARSIP',
    icon: Archive,
    path: '/workspace',
  },
  {
    title: 'SIANALITIK',
    icon: BarChart3,
    path: '/workspace',
  },
  {
    title: 'RBAC',
    icon: ShieldCheck,
    path: '/workspace',
  },
  {
    title: 'Pengguna',
    icon: Users,
    path: '/workspace',
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    path: '/workspace',
  },
];

export const MENU_MEGA: MenuConfig = MENU_SIDEBAR.filter((item) => !item.heading);
export const MENU_MEGA_MOBILE: MenuConfig = MENU_MEGA;
