import type { OpdSubmissionModuleKey } from './types';

const MODULE_SOP_MAP: Record<OpdSubmissionModuleKey, string> = {
  SIPENSIUN: 'SOP-BKPSDM-PAN-002',
  SIDATA: 'SOP-BKPSDM-DAT-002',
  LAYANAN_KEPEGAWAIAN: 'SOP-BKPSDM-LAY-002',
  DMS: 'SOP-BKPSDM-DMS-001',
};

export function getSopCodeForSubmission(
  moduleKey: OpdSubmissionModuleKey | string,
  serviceType?: string | null,
) {
  if (moduleKey in MODULE_SOP_MAP) {
    return MODULE_SOP_MAP[moduleKey as OpdSubmissionModuleKey];
  }

  const normalizedService = (serviceType ?? '').toUpperCase();

  if (normalizedService.includes('PENSIUN')) {
    return MODULE_SOP_MAP.SIPENSIUN;
  }

  if (normalizedService.includes('DATA')) {
    return MODULE_SOP_MAP.SIDATA;
  }

  return MODULE_SOP_MAP.LAYANAN_KEPEGAWAIAN;
}
