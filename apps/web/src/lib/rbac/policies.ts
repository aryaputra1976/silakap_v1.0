import type { AppRole } from './roles';
import { getOpdDefaultPath } from './opd-menu';

export const APP_MODULE_KEYS = [
  'DASHBOARD',
  'KINERJA_BIDANG',
  'SIAP',
  'DMS',
  'SIPENSIUN',
  'LAYANAN_KEPEGAWAIAN',
  'SIDATA',
  'SIANALITIK',
  'SIARSIP',
  'WORKING_CALENDAR',
  'ADMIN',
] as const;

export type AppModuleKey = (typeof APP_MODULE_KEYS)[number];

export type AppPermission =
  | 'read'
  | 'input'
  | 'upload'
  | 'verify'
  | 'review'
  | 'approve'
  | 'monitor'
  | 'report'
  | 'admin';

type ModulePolicy = Partial<Record<AppModuleKey, AppPermission[]>>;

const FULL_PERMISSIONS: AppPermission[] = [
  'read',
  'input',
  'upload',
  'verify',
  'review',
  'approve',
  'monitor',
  'report',
  'admin',
];

const FIELD_CONTROL_PERMISSIONS: AppPermission[] = [
  'read',
  'input',
  'upload',
  'verify',
  'review',
  'approve',
  'monitor',
  'report',
];

const MADYA_PERMISSIONS: AppPermission[] = [
  'read',
  'input',
  'upload',
  'verify',
  'review',
  'monitor',
  'report',
];

const TECHNICAL_PERMISSIONS: AppPermission[] = [
  'read',
  'input',
  'upload',
  'verify',
  'monitor',
  'report',
];

const FIRST_REVIEW_PERMISSIONS: AppPermission[] = [
  'read',
  'input',
  'upload',
  'verify',
];

const LIMITED_INPUT_PERMISSIONS: AppPermission[] = ['read', 'input', 'upload'];
const EXECUTIVE_PERMISSIONS: AppPermission[] = [
  'read',
  'monitor',
  'approve',
  'report',
];

export const ADMIN_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
export const EXECUTIVE_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
];
export const INTERNAL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];
export const OPERATIONAL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];
export const OPD_ROLES: AppRole[] = ['OPD'];

export const ROLE_MODULE_POLICIES: Record<AppRole, ModulePolicy> = {
  SUPER_ADMIN: Object.fromEntries(
    APP_MODULE_KEYS.map((moduleKey) => [moduleKey, FULL_PERMISSIONS]),
  ) as ModulePolicy,
  ADMIN_BKPSDM: Object.fromEntries(
    APP_MODULE_KEYS.map((moduleKey) => [moduleKey, FULL_PERMISSIONS]),
  ) as ModulePolicy,
  KEPALA_BADAN: {
    DASHBOARD: ['read', 'monitor', 'report'],
    KINERJA_BIDANG: EXECUTIVE_PERMISSIONS,
    SIAP: EXECUTIVE_PERMISSIONS,
    DMS: ['read', 'monitor', 'report'],
    SIPENSIUN: EXECUTIVE_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: EXECUTIVE_PERMISSIONS,
    SIDATA: ['read', 'monitor', 'report'],
    SIANALITIK: ['read', 'monitor', 'report'],
    WORKING_CALENDAR: ['read', 'monitor'],
  },
  KABID: {
    DASHBOARD: ['read', 'monitor', 'report'],
    KINERJA_BIDANG: FIELD_CONTROL_PERMISSIONS,
    SIAP: FIELD_CONTROL_PERMISSIONS,
    DMS: FIELD_CONTROL_PERMISSIONS,
    SIPENSIUN: FIELD_CONTROL_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: FIELD_CONTROL_PERMISSIONS,
    SIDATA: FIELD_CONTROL_PERMISSIONS,
    SIANALITIK: ['read', 'monitor', 'report'],
    SIARSIP: ['read', 'input', 'upload', 'monitor'],
    WORKING_CALENDAR: ['read', 'input', 'monitor'],
  },
  ANALIS_MADYA: {
    DASHBOARD: ['read'],
    KINERJA_BIDANG: MADYA_PERMISSIONS,
    SIAP: MADYA_PERMISSIONS,
    DMS: MADYA_PERMISSIONS,
    SIPENSIUN: MADYA_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: MADYA_PERMISSIONS,
    SIDATA: MADYA_PERMISSIONS,
    SIANALITIK: ['read', 'monitor', 'report'],
    SIARSIP: ['read', 'input', 'upload'],
  },
  ANALIS_MUDA: {
    DASHBOARD: ['read'],
    KINERJA_BIDANG: TECHNICAL_PERMISSIONS,
    SIAP: TECHNICAL_PERMISSIONS,
    DMS: TECHNICAL_PERMISSIONS,
    SIPENSIUN: TECHNICAL_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: TECHNICAL_PERMISSIONS,
    SIDATA: TECHNICAL_PERMISSIONS,
    SIARSIP: ['read', 'input', 'upload'],
  },
  ANALIS_PERTAMA: {
    DASHBOARD: ['read'],
    KINERJA_BIDANG: FIRST_REVIEW_PERMISSIONS,
    SIAP: FIRST_REVIEW_PERMISSIONS,
    DMS: FIRST_REVIEW_PERMISSIONS,
    SIPENSIUN: FIRST_REVIEW_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: FIRST_REVIEW_PERMISSIONS,
    SIDATA: FIRST_REVIEW_PERMISSIONS,
    SIARSIP: ['read', 'input', 'upload'],
  },
  PENELAAH: {
    DASHBOARD: ['read'],
    KINERJA_BIDANG: FIRST_REVIEW_PERMISSIONS,
    SIAP: FIRST_REVIEW_PERMISSIONS,
    DMS: FIRST_REVIEW_PERMISSIONS,
    SIPENSIUN: FIRST_REVIEW_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: FIRST_REVIEW_PERMISSIONS,
    SIDATA: FIRST_REVIEW_PERMISSIONS,
    SIARSIP: ['read', 'input', 'upload'],
  },
  PPPK: {
    KINERJA_BIDANG: LIMITED_INPUT_PERMISSIONS,
    SIAP: LIMITED_INPUT_PERMISSIONS,
    DMS: ['upload'],
    SIPENSIUN: LIMITED_INPUT_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: LIMITED_INPUT_PERMISSIONS,
    SIARSIP: ['upload'],
  },
  OPD: {
    SIPENSIUN: LIMITED_INPUT_PERMISSIONS,
    LAYANAN_KEPEGAWAIAN: LIMITED_INPUT_PERMISSIONS,
  },
};

export function canAccessModule(
  role: AppRole,
  moduleKey: AppModuleKey,
  requiredPermission: AppPermission = 'read',
): boolean {
  const permissions = ROLE_MODULE_POLICIES[role]?.[moduleKey] ?? [];

  return permissions.includes(requiredPermission);
}

export function getDefaultDashboardPath(role: AppRole): string {
  if (role === 'OPD') {
    return getOpdDefaultPath();
  }

  if (role === 'PPPK') {
    return '/siap/worklogs';
  }

  return '/dashboard';
}
