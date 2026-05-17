import type {
  KinerjaBidangRealization,
  KinerjaSopRealizationStatus,
} from '@/lib/api/kinerja-bidang';

export type KinerjaRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'KEPALA_BADAN'
  | 'SEKRETARIS'
  | 'KABID'
  | 'STAFF'
  | 'UNKNOWN';

export interface RealizationPermissionState {
  role: KinerjaRole;
  canWrite: boolean;
  canReview: boolean;
  canSubmit: boolean;
  canReviewSubmitted: boolean;
  canApprove: boolean;
  canRequestRevision: boolean;
  canChangeEvidence: boolean;
}

const WRITE_ROLES: KinerjaRole[] = ['SUPER_ADMIN', 'ADMIN', 'KABID', 'STAFF'];
const REVIEW_ROLES: KinerjaRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'KEPALA_BADAN',
  'SEKRETARIS',
  'KABID',
];

export function getCurrentKinerjaRole(): KinerjaRole {
  const fromStorage = getRoleFromStorage();

  if (fromStorage) {
    return normalizeRole(fromStorage);
  }

  const fromJwt = getRoleFromJwt();

  if (fromJwt) {
    return normalizeRole(fromJwt);
  }

  return 'UNKNOWN';
}

export function getRealizationPermissions(
  realization: KinerjaBidangRealization,
  role: KinerjaRole = getCurrentKinerjaRole(),
): RealizationPermissionState {
  const canWrite = WRITE_ROLES.includes(role);
  const canReview = REVIEW_ROLES.includes(role);
  const editable = realization.status !== 'APPROVED';

  return {
    role,
    canWrite,
    canReview,
    canSubmit:
      canWrite &&
      (realization.status === 'DRAFT' ||
        realization.status === 'REVISION_REQUIRED'),
    canReviewSubmitted: canReview && realization.status === 'SUBMITTED',
    canApprove:
      canReview &&
      (realization.status === 'SUBMITTED' ||
        realization.status === 'REVIEWED'),
    canRequestRevision:
      canReview &&
      (realization.status === 'SUBMITTED' ||
        realization.status === 'REVIEWED'),
    canChangeEvidence: canWrite && editable,
  };
}

export function getRealizationBlockingReasons(
  realization: KinerjaBidangRealization,
): string[] {
  const reasons: string[] = [];

  if (realization.realizationQuantity <= 0) {
    reasons.push('Kuantitas realisasi masih 0.');
  }

  if (realization.evidence.length === 0) {
    reasons.push('Belum ada bukti dukung DMS.');
  }

  if (!realization.title.trim()) {
    reasons.push('Judul realisasi belum diisi.');
  }

  return reasons;
}

export function canApproveRealization(
  realization: KinerjaBidangRealization,
  role: KinerjaRole = getCurrentKinerjaRole(),
): boolean {
  const permissions = getRealizationPermissions(realization, role);
  return (
    permissions.canApprove &&
    getRealizationBlockingReasons(realization).length === 0
  );
}

export function realizationStatusHelp(status: KinerjaSopRealizationStatus): string {
  const help: Record<KinerjaSopRealizationStatus, string> = {
    DRAFT:
      'Draft masih dapat diedit dan belum masuk proses review.',
    SUBMITTED:
      'Submitted menunggu review Kabid/pejabat yang berwenang.',
    REVIEWED:
      'Reviewed sudah diperiksa dan dapat disetujui atau dikembalikan.',
    APPROVED:
      'Approved sudah final dan terkunci dari perubahan.',
    REVISION_REQUIRED:
      'Perlu revisi. Perbaiki data/bukti lalu submit ulang.',
  };

  return help[status];
}

function getRoleFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const directKeys = ['role', 'userRole', 'silakap_role', 'auth_role'];

  for (const key of directKeys) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  const objectKeys = [
    'auth',
    'auth-store',
    'authStore',
    'silakap_auth',
    'user',
    'profile',
  ];

  for (const key of objectKeys) {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as {
        state?: { user?: { role?: string }; role?: string };
        user?: { role?: string };
        role?: string;
      };

      const role =
        parsed.role ??
        parsed.user?.role ??
        parsed.state?.role ??
        parsed.state?.user?.role;

      if (role) {
        return role;
      }
    } catch {
      // ignore invalid localStorage value
    }
  }

  return null;
}

function getRoleFromJwt(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const tokenKeys = [
    'accessToken',
    'access_token',
    'token',
    'authToken',
    'silakap_access_token',
  ];

  for (const key of tokenKeys) {
    const token = window.localStorage.getItem(key);

    if (!token) {
      continue;
    }

    const role = parseRoleFromJwt(token);

    if (role) {
      return role;
    }
  }

  return null;
}

function parseRoleFromJwt(token: string): string | null {
  const parts = token.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(
      window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as {
      role?: string;
      roles?: string[];
      user?: { role?: string };
    };

    return payload.role ?? payload.user?.role ?? payload.roles?.[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeRole(value: string): KinerjaRole {
  const normalized = value.trim().toUpperCase().replaceAll(' ', '_');

  if (
    normalized === 'SUPER_ADMIN' ||
    normalized === 'ADMIN' ||
    normalized === 'KEPALA_BADAN' ||
    normalized === 'SEKRETARIS' ||
    normalized === 'KABID' ||
    normalized === 'STAFF'
  ) {
    return normalized;
  }

  return 'UNKNOWN';
}
