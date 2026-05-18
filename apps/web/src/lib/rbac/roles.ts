export const ACTIVE_APP_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
  'OPD',
] as const;

export type AppRole = (typeof ACTIVE_APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_BKPSDM: 'Admin BKPSDM',
  KEPALA_BADAN: 'Kepala Badan',
  KABID: 'Kepala Bidang',
  ANALIS_MADYA: 'Analis Madya',
  ANALIS_MUDA: 'Analis Muda',
  ANALIS_PERTAMA: 'Analis Pertama',
  PENELAAH: 'Penelaah',
  PPPK: 'PPPK',
  OPD: 'OPD',
};

const ROLE_PRIORITY: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
  'OPD',
];

export function normalizeAppRole(role: string | null | undefined): AppRole {
  if (!role) {
    return 'OPD';
  }

  const normalized = role.trim().toUpperCase();

  return ACTIVE_APP_ROLES.includes(normalized as AppRole)
    ? (normalized as AppRole)
    : 'OPD';
}

export function getPrimaryRole(
  roles: readonly string[] | null | undefined,
): AppRole {
  const normalizedRoles = new Set(
    (roles ?? []).map((role) => normalizeAppRole(role)),
  );

  return ROLE_PRIORITY.find((role) => normalizedRoles.has(role)) ?? 'OPD';
}

export function isOperationalStaffRole(role: AppRole): boolean {
  return [
    'ANALIS_MADYA',
    'ANALIS_MUDA',
    'ANALIS_PERTAMA',
    'PENELAAH',
    'PPPK',
  ].includes(role);
}

export function isAdminRole(role: AppRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_BKPSDM';
}
