import {
  canAccessModule,
  getDefaultDashboardPath,
  type AppModuleKey,
  type AppPermission,
} from './policies';
import { getPrimaryRole, normalizeAppRole, type AppRole } from './roles';

interface RouteRule {
  prefix: string;
  moduleKey: AppModuleKey;
  requiredPermission?: AppPermission;
  allowedRoles?: AppRole[];
}

const ROUTE_ACCESS_RULES: RouteRule[] = [
  { prefix: '/dashboard', moduleKey: 'DASHBOARD' },
  {
    prefix: '/kinerja-bidang/realizations',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'input',
  },
  {
    prefix: '/kinerja-bidang/realisasi',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'input',
  },
  {
    prefix: '/kinerja-bidang/report',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'report',
  },
  {
    prefix: '/kinerja-bidang/laporan',
    moduleKey: 'KINERJA_BIDANG',
    requiredPermission: 'report',
  },
  { prefix: '/kinerja-bidang', moduleKey: 'KINERJA_BIDANG' },
  {
    prefix: '/siap/worklogs/executive',
    moduleKey: 'SIAP',
    requiredPermission: 'monitor',
  },
  {
    prefix: '/siap/worklogs/team',
    moduleKey: 'SIAP',
    requiredPermission: 'review',
  },
  { prefix: '/siap', moduleKey: 'SIAP' },
  { prefix: '/dms/upload', moduleKey: 'DMS', requiredPermission: 'upload' },
  {
    prefix: '/dms/verification',
    moduleKey: 'DMS',
    requiredPermission: 'verify',
  },
  { prefix: '/dms/reports', moduleKey: 'DMS', requiredPermission: 'report' },
  { prefix: '/dms', moduleKey: 'DMS' },
  { prefix: '/sipensiun', moduleKey: 'SIPENSIUN' },
  {
    prefix: '/layanan/verifikasi',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'verify',
  },
  {
    prefix: '/layanan/laporan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    requiredPermission: 'report',
  },
  { prefix: '/layanan', moduleKey: 'LAYANAN_KEPEGAWAIAN' },
  { prefix: '/sidata/import', moduleKey: 'SIDATA', requiredPermission: 'upload' },
  { prefix: '/sidata/laporan', moduleKey: 'SIDATA', requiredPermission: 'report' },
  { prefix: '/sidata', moduleKey: 'SIDATA' },
  { prefix: '/sianalitik', moduleKey: 'SIANALITIK' },
  { prefix: '/siarsip', moduleKey: 'SIARSIP' },
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
