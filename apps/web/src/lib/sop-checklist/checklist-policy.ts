import type { AppRole } from '@/lib/rbac/roles';
import type { SopModuleKey } from '@/lib/dms/sop-taxonomy';
import type { SopChecklistTemplate } from './checklist-types';
import { ALL_CHECKLIST_TEMPLATES } from './checklist-templates';

// ─── Lookup index ─────────────────────────────────────────────────────────────

const _byCode = new Map<string, SopChecklistTemplate>(
  ALL_CHECKLIST_TEMPLATES.map((t) => [t.sopCode, t]),
);

// ─── Template lookup ──────────────────────────────────────────────────────────

export function getChecklistTemplateBySopCode(
  sopCode: string,
): SopChecklistTemplate | undefined {
  return _byCode.get(sopCode);
}

export function getChecklistTemplatesByModule(
  moduleKey: SopModuleKey,
): SopChecklistTemplate[] {
  return ALL_CHECKLIST_TEMPLATES.filter((t) => t.moduleKey === moduleKey);
}

// ─── Role policy helpers ──────────────────────────────────────────────────────

/**
 * SUPER_ADMIN and ADMIN_BKPSDM always have full access.
 * KEPALA_BADAN can view/approve any checklist.
 * KABID can view/edit/approve within their module.
 * ANALIS_MADYA can view/edit/review (approve).
 * ANALIS_MUDA, ANALIS_PERTAMA, PENELAAH can view/edit initial data.
 * PPPK can view/edit non-confidential checklists; cannot approve.
 * OPD can only view checklist status; cannot edit any internal checklist.
 */

export function canViewChecklist(role: AppRole, sopCode: string): boolean {
  const template = _byCode.get(sopCode);
  if (!template) return false;
  return (template.rolePolicy.viewers as AppRole[]).includes(role);
}

export function canEditChecklist(role: AppRole, sopCode: string): boolean {
  const template = _byCode.get(sopCode);
  if (!template) return false;
  if (role === 'OPD') return false;
  return (template.rolePolicy.editors as AppRole[]).includes(role);
}

export function canApproveChecklist(role: AppRole, sopCode: string): boolean {
  const template = _byCode.get(sopCode);
  if (!template) return false;
  if (role === 'OPD' || role === 'PPPK') return false;
  return (template.rolePolicy.approvers as AppRole[]).includes(role);
}

// ─── Convenience: combined capability summary ─────────────────────────────────

export interface ChecklistCapability {
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

export function getChecklistCapability(
  role: AppRole,
  sopCode: string,
): ChecklistCapability {
  return {
    canView: canViewChecklist(role, sopCode),
    canEdit: canEditChecklist(role, sopCode),
    canApprove: canApproveChecklist(role, sopCode),
  };
}
