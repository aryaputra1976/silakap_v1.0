import {
  canAccessModule,
  getDefaultDashboardPath,
  INTERNAL_ROLES,
  OPD_ROLES,
  type AppModuleKey,
  type AppPermission,
} from './policies';
import { getPrimaryRole, normalizeAppRole, type AppRole } from './roles';

interface RouteRule {
  prefix: string;
  moduleKey?: AppModuleKey;
  requiredPermission?: AppPermission;
  allowedRoles?: AppRole[];
}

const ROUTE_ACCESS_RULES: RouteRule[] = [
  { prefix: '/opd', allowedRoles: OPD_ROLES },
  { prefix: '/dashboard', moduleKey: 'DASHBOARD', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/kinerja-bidang/targets',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/monitoring-kegiatan',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/monitoring',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/realizations',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'input',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/realisasi',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'input',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/report',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'report',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/kinerja-bidang/laporan',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'report',
    allowedRoles: INTERNAL_ROLES,
  },
  { prefix: '/kinerja-bidang', moduleKey: 'KINERJA_BIDANG', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/siap/worklogs/executive',
    moduleKey: 'SIAP',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/siap/worklogs/team',
    moduleKey: 'SIAP',
    requiredPermission: 'review',
    allowedRoles: INTERNAL_ROLES,
  },
  { prefix: '/siap', moduleKey: 'SIAP', allowedRoles: INTERNAL_ROLES },
  { prefix: '/dms/upload', moduleKey: 'DMS', requiredPermission: 'upload', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/dms/verification',
    moduleKey: 'DMS',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  { prefix: '/dms/reports', moduleKey: 'DMS', requiredPermission: 'report', allowedRoles: INTERNAL_ROLES },
  { prefix: '/dms', moduleKey: 'DMS', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sipensiun', moduleKey: 'SIPENSIUN', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/layanan/verifikasi',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/workbench',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/sla',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/keterlambatan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/kepuasan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/ikm/dashboard',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/ikm/periode',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/ikm/data',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'monitor',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/layanan/laporan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'report',
    allowedRoles: INTERNAL_ROLES,
  },
  { prefix: '/layanan', moduleKey: 'LAYANAN_KEPEGAWAIAN', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/rekonsiliasi-bpkad/import',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'upload',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/periode',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/matching',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/temuan',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'verify',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/tindak-lanjut',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'input',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/berita-acara',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'approve',
    allowedRoles: INTERNAL_ROLES,
  },
  {
    prefix: '/rekonsiliasi-bpkad/laporan',
    moduleKey: 'REKONSILIASI_BPKAD',
    requiredPermission: 'report',
    allowedRoles: INTERNAL_ROLES,
  },
  { prefix: '/rekonsiliasi-bpkad', moduleKey: 'REKONSILIASI_BPKAD', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/import/riwayat', moduleKey: 'SIDATA', requiredPermission: 'monitor', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/import/log-sinkronisasi', moduleKey: 'SIDATA', requiredPermission: 'monitor', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/import/mapping-referensi', moduleKey: 'SIDATA', requiredPermission: 'verify', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/import', moduleKey: 'SIDATA', requiredPermission: 'upload', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/validasi', moduleKey: 'SIDATA', requiredPermission: 'verify', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/pemutakhiran', moduleKey: 'SIDATA', requiredPermission: 'input', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/rekonsiliasi', moduleKey: 'SIDATA', requiredPermission: 'verify', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/arsip', moduleKey: 'SIDATA', requiredPermission: 'monitor', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata/laporan', moduleKey: 'SIDATA', requiredPermission: 'report', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sidata', moduleKey: 'SIDATA', allowedRoles: INTERNAL_ROLES },
  { prefix: '/sianalitik', moduleKey: 'SIANALITIK', allowedRoles: INTERNAL_ROLES },
  { prefix: '/siarsip', moduleKey: 'SIARSIP', allowedRoles: INTERNAL_ROLES },
  { prefix: '/working-calendar', moduleKey: 'WORKING_CALENDAR', allowedRoles: INTERNAL_ROLES },
  { prefix: '/pemberhentian/monitoring', moduleKey: 'PEMBERHENTIAN', requiredPermission: 'monitor', allowedRoles: INTERNAL_ROLES },
  { prefix: '/pemberhentian/proses', moduleKey: 'PEMBERHENTIAN', requiredPermission: 'read', allowedRoles: INTERNAL_ROLES },
  { prefix: '/pemberhentian', moduleKey: 'PEMBERHENTIAN', allowedRoles: INTERNAL_ROLES },
  { prefix: '/siformen', moduleKey: 'SIFORMEN', allowedRoles: INTERNAL_ROLES },
  {
    prefix: '/admin',
    moduleKey: 'ADMIN',
    requiredPermission: 'admin',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN_BKPSDM'],
  },
];

export function canAccessRoute(
  role: AppRole | string | null | undefined,
  path: string,
): boolean {
  const appRole = normalizeAppRole(role);
  const rule = findRouteRule(path);

  if (!rule) {
    return true;
  }

  if (rule.allowedRoles?.length && !rule.allowedRoles.includes(appRole)) {
    return false;
  }

  if (!rule.moduleKey) {
    return true;
  }

  return canAccessModule(
    appRole,
    rule.moduleKey,
    rule.requiredPermission ?? 'read',
  );
}

export function canAccessRouteForRoles(
  roles: readonly string[] | null | undefined,
  path: string,
): boolean {
  return canAccessRoute(getPrimaryRole(roles), path);
}

export function getSafeRedirectPath(
  roles: readonly string[] | null | undefined,
): string {
  const primaryRole = getPrimaryRole(roles);
  const preferredPath = getDefaultDashboardPath(primaryRole);

  if (canAccessRoute(primaryRole, preferredPath)) {
    return preferredPath;
  }

  if (canAccessRoute(primaryRole, '/dashboard')) {
    return '/dashboard';
  }

  if (canAccessRoute(primaryRole, '/layanan')) {
    return '/layanan';
  }

  return '/login';
}

function findRouteRule(path: string): RouteRule | undefined {
  const normalized = normalizePath(path);

  return ROUTE_ACCESS_RULES.filter((rule) =>
    normalized.startsWith(rule.prefix),
  ).sort((left, right) => right.prefix.length - left.prefix.length)[0];
}

function normalizePath(path: string): string {
  const [pathname] = path.split('?');
  return pathname.replace(/\/+$/, '') || '/';
}
