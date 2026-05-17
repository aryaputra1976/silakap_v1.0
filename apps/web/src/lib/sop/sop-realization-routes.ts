export interface BuildRealizationCreatePathInput {
  year: string | number;
  targetId?: string;
  rhkCode?: string;
  source?: 'dashboard' | 'monitoring' | 'report' | 'detail';
}

export function buildRealizationCreatePath(input: BuildRealizationCreatePathInput) {
  const params = new URLSearchParams();

  params.set('mode', 'create');
  params.set('year', String(input.year));

  if (input.targetId) {
    params.set('targetId', input.targetId);
  }

  if (input.rhkCode) {
    params.set('rhkCode', input.rhkCode);
  }

  if (input.source) {
    params.set('source', input.source);
  }

  return `/kinerja-bidang/realisasi?${params.toString()}`;
}
