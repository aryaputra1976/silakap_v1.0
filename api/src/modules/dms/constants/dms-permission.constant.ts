import { Prisma } from '@prisma/client';
import { AuthUser } from '../../auth/auth.types';

export const DMS_ALL_ACCESS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
] as const;

export const DMS_UNIT_SCOPE_ROLES = [
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
] as const;

export const DMS_OWN_SCOPE_ROLES = [
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
  // External OPD user — can upload persyaratan documents, sees only own uploads, INTERNAL level only
  'OPD_OPERATOR',
] as const;

export const DMS_VIEW_ROLES = [
  ...DMS_ALL_ACCESS_ROLES,
  ...DMS_UNIT_SCOPE_ROLES,
  ...DMS_OWN_SCOPE_ROLES,
] as const;

export const DMS_CREATE_ROLES = [
  ...DMS_ALL_ACCESS_ROLES,
  ...DMS_UNIT_SCOPE_ROLES,
  ...DMS_OWN_SCOPE_ROLES,
] as const;

export const DMS_VERIFY_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
] as const;

export const DMS_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
] as const;

export const DMS_ACCESS_ROLES = uniqueRoles([
  ...DMS_VIEW_ROLES,
  ...DMS_CREATE_ROLES,
  ...DMS_VERIFY_ROLES,
  ...DMS_ADMIN_ROLES,
]);

// ---------------------------------------------------------------------------
// Access-level policy
//
// Role mapping notes (roles requested by sprint spec vs existing codebase):
//   ADMIN_DMS    → ADMIN_BKPSDM  (closest DMS admin role)
//   ADMIN_DATA   → ANALIS_MADYA  (senior analyst managing data)
//   SEKRETARIS   → no existing match; omitted from TERBATAS & PIMPINAN
//   AUDITOR      → no existing match; omitted from AUDIT & SANGAT_TERBATAS
//   SUPER_ADMIN  → always has access (implicit via DMS_ALL_ACCESS_ROLES)
//
// Limitation: SEKRETARIS and AUDITOR roles do not exist in the codebase.
// If these roles are added in the future, include them in the respective lists below.
// ---------------------------------------------------------------------------

export const DMS_ACCESS_LEVEL_ROLES: Readonly<Record<string, readonly string[]>> = {
  // INTERNAL: all authenticated DMS users can view
  INTERNAL: DMS_VIEW_ROLES,

  // TERBATAS: senior analysts and above
  // Maps: ADMIN_DMS→ADMIN_BKPSDM, ADMIN_DATA→ANALIS_MADYA; SEKRETARIS/AUDITOR omitted
  TERBATAS: [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KEPALA_BADAN',
    'KABID',
    'ANALIS_MADYA',
    'ANALIS_MUDA',
  ] as const,

  // SANGAT_TERBATAS: leadership and DMS admin only
  // Maps: ADMIN_DMS→ADMIN_BKPSDM; AUDITOR omitted
  SANGAT_TERBATAS: [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KEPALA_BADAN',
    'KABID',
  ] as const,

  // PIMPINAN: leadership only
  // Maps: SEKRETARIS omitted (no matching role)
  PIMPINAN: [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KEPALA_BADAN',
    'KABID',
  ] as const,

  // AUDIT: audit-capable roles
  // Maps: AUDITOR omitted (no matching role)
  AUDIT: [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KEPALA_BADAN',
    'KABID',
  ] as const,
};

export type DmsAccessScope = 'ALL' | 'UNIT' | 'OWN';

export interface DmsDocumentAccessSubject {
  createdById: string | null;
  unitKerjaId: string | null;
  accessLevel?: string | null;
}

export function getDmsAccessScope(user: AuthUser): DmsAccessScope {
  if (hasAnyDmsRole(user, DMS_ALL_ACCESS_ROLES)) {
    return 'ALL';
  }

  if (hasAnyDmsRole(user, DMS_UNIT_SCOPE_ROLES) && user.unitKerjaId) {
    return 'UNIT';
  }

  return 'OWN';
}

export function hasAnyDmsRole(
  user: AuthUser,
  roles: readonly string[],
): boolean {
  return user.roles.some((role) => roles.includes(role));
}

export function canAccessAllDmsDocuments(user: AuthUser): boolean {
  return getDmsAccessScope(user) === 'ALL';
}

export function canAccessUnitDmsDocuments(user: AuthUser): boolean {
  return getDmsAccessScope(user) === 'UNIT';
}

export function canVerifyDmsDocument(user: AuthUser): boolean {
  return hasAnyDmsRole(user, DMS_VERIFY_ROLES);
}

export function canAdminDms(user: AuthUser): boolean {
  return hasAnyDmsRole(user, DMS_ADMIN_ROLES);
}

/** Returns true if the user's roles allow viewing documents at the given accessLevel. */
export function canUserSeeAccessLevel(user: AuthUser, accessLevel: string): boolean {
  const allowedRoles = DMS_ACCESS_LEVEL_ROLES[accessLevel];
  if (!allowedRoles) {
    // Unknown access level → treat as INTERNAL (most permissive)
    return hasAnyDmsRole(user, DMS_VIEW_ROLES);
  }
  return hasAnyDmsRole(user, allowedRoles);
}

/** Returns the list of accessLevel values the user is permitted to see. */
export function getAllowedAccessLevels(user: AuthUser): string[] {
  return Object.keys(DMS_ACCESS_LEVEL_ROLES).filter((level) =>
    canUserSeeAccessLevel(user, level),
  );
}

export function canAccessDmsDocument(
  document: DmsDocumentAccessSubject,
  user: AuthUser,
): boolean {
  // Access-level check first — takes precedence over scope
  if (document.accessLevel) {
    if (!canUserSeeAccessLevel(user, document.accessLevel)) {
      return false;
    }
  }

  const scope = getDmsAccessScope(user);

  if (scope === 'ALL') {
    return true;
  }

  if (
    scope === 'UNIT' &&
    user.unitKerjaId &&
    document.unitKerjaId === user.unitKerjaId
  ) {
    return true;
  }

  return document.createdById === user.id;
}

export function applyDmsDocumentScope(
  where: Prisma.DmsDocumentWhereInput,
  user: AuthUser,
): Prisma.DmsDocumentWhereInput {
  const scope = getDmsAccessScope(user);

  if (scope === 'ALL') {
    return where;
  }

  if (scope === 'UNIT' && user.unitKerjaId) {
    return {
      ...where,
      unitKerjaId: user.unitKerjaId,
    };
  }

  return {
    ...where,
    createdById: user.id,
  };
}

function uniqueRoles(values: readonly string[]): string[] {
  return [...new Set(values)];
}
