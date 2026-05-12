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

export type DmsAccessScope = 'ALL' | 'UNIT' | 'OWN';

export interface DmsDocumentAccessSubject {
  createdById: string | null;
  unitKerjaId: string | null;
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

export function canAccessDmsDocument(
  document: DmsDocumentAccessSubject,
  user: AuthUser,
): boolean {
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
