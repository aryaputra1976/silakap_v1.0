export type RhkSopMapping = {
  rhkCode: string | null;
  sopCode: string | null;
};

const MAPPINGS: Record<string, RhkSopMapping> = {
  // Layanan Kepegawaian
  'LAYANAN_KEPEGAWAIAN:kenaikan_pangkat': { rhkCode: 'RHK-LAY-01', sopCode: 'LAY-001' },
  'LAYANAN_KEPEGAWAIAN:pengangkatan': { rhkCode: 'RHK-LAY-01', sopCode: 'LAY-001' },
  'LAYANAN_KEPEGAWAIAN:mutasi': { rhkCode: 'RHK-LAY-02', sopCode: 'LAY-002' },
  'LAYANAN_KEPEGAWAIAN:pemberhentian': { rhkCode: 'RHK-LAY-02', sopCode: 'LAY-002' },
  'LAYANAN_KEPEGAWAIAN:cuti': { rhkCode: 'RHK-LAY-03', sopCode: 'LAY-003' },
  'LAYANAN_KEPEGAWAIAN:penghargaan': { rhkCode: 'RHK-LAY-03', sopCode: 'LAY-003' },
  'LAYANAN_KEPEGAWAIAN:disiplin': { rhkCode: 'RHK-LAY-04', sopCode: 'LAY-004' },
  // SIPENSIUN
  'SIPENSIUN:pensiun_normal': { rhkCode: 'RHK-PAN-01', sopCode: 'PAN-002' },
  'SIPENSIUN:pensiun_dini': { rhkCode: 'RHK-PAN-01', sopCode: 'PAN-002' },
  'SIPENSIUN:bup': { rhkCode: 'RHK-PAN-01', sopCode: 'PAN-002' },
  'SIPENSIUN:purnabakti': { rhkCode: 'RHK-PAN-01', sopCode: 'PAN-002' },
  // SIDATA
  'SIDATA:pemutakhiran_data': { rhkCode: 'RHK-DAT-01', sopCode: 'DAT-002' },
  'SIDATA:rekonsiliasi': { rhkCode: 'RHK-DAT-01', sopCode: 'DAT-002' },
  'SIDATA:validasi': { rhkCode: 'RHK-DAT-02', sopCode: 'DAT-003' },
  // DMS
  'DMS:arsip_kepegawaian': { rhkCode: 'RHK-DMS-01', sopCode: 'DMS-001' },
  'DMS:dokumen_pensiun': { rhkCode: 'RHK-DMS-01', sopCode: 'DMS-001' },
};

export function getRhkSopMapping(moduleKey: string, serviceType: string): RhkSopMapping {
  const key = `${moduleKey.toUpperCase()}:${serviceType.toLowerCase().replace(/\s+/g, '_')}`;
  return MAPPINGS[key] ?? { rhkCode: null, sopCode: null };
}
