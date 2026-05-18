import type { AppRole } from '@/lib/rbac/roles';
import type { OpdSubmissionStatus } from './types';

export type InternalSubmissionAction =
  | 'receive'
  | 'start-verification'
  | 'request-correction'
  | 'verify'
  | 'reject'
  | 'complete';

const FULL_ACTION_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
const RECEIVE_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];
const START_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];
const CORRECTION_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
];
const VERIFY_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
];
const REJECT_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
];
const COMPLETE_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

function hasRole(role: AppRole, roles: AppRole[]) {
  return roles.includes(role) || FULL_ACTION_ROLES.includes(role);
}

export function canReceiveSubmission(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return (
    hasRole(role, RECEIVE_ROLES) &&
    (status === 'SUBMITTED' || status === 'CORRECTION_SUBMITTED')
  );
}

export function canStartVerification(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return hasRole(role, START_ROLES) && status === 'RECEIVED';
}

export function canRequestCorrection(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return (
    hasRole(role, CORRECTION_ROLES) &&
    (status === 'RECEIVED' ||
      status === 'IN_VERIFICATION' ||
      status === 'CORRECTION_SUBMITTED')
  );
}

export function canVerifySubmission(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return (
    hasRole(role, VERIFY_ROLES) &&
    (status === 'IN_VERIFICATION' || status === 'CORRECTION_SUBMITTED')
  );
}

export function canRejectSubmission(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return (
    hasRole(role, REJECT_ROLES) &&
    (status === 'RECEIVED' ||
      status === 'IN_VERIFICATION' ||
      status === 'CORRECTION_SUBMITTED')
  );
}

export function canCompleteSubmission(
  role: AppRole,
  status: OpdSubmissionStatus | string,
) {
  return hasRole(role, COMPLETE_ROLES) && status === 'VERIFIED';
}

export function getAvailableInternalActions(
  role: AppRole,
  status: OpdSubmissionStatus | string,
): InternalSubmissionAction[] {
  if (role === 'OPD') {
    return [];
  }

  return [
    canReceiveSubmission(role, status) ? 'receive' : null,
    canStartVerification(role, status) ? 'start-verification' : null,
    canRequestCorrection(role, status) ? 'request-correction' : null,
    canVerifySubmission(role, status) ? 'verify' : null,
    canRejectSubmission(role, status) ? 'reject' : null,
    canCompleteSubmission(role, status) ? 'complete' : null,
  ].filter((action): action is InternalSubmissionAction => Boolean(action));
}
