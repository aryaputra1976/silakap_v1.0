import { apiClient } from './client';

export interface GajiPokokRow {
  id: number;
  golonganKode: string;
  masaKerja: number;
  gajiPokok: string;
  berlakuSejak: string;
  updatedAt: string;
}

export interface GajiPokokMatrixItem {
  golonganKode: string;
  urutan: number;
  berlakuSejak: string;
  rows: Array<{
    id: number;
    masaKerja: number;
    gajiPokok: string;
  }>;
}

export interface GajiPokokLookupResult {
  golonganKode: string;
  masaKerja: number;
  gajiPokok: string;
  berlakuSejak: string;
}

export interface GajiPokokSummary {
  totalRecords: number;
  totalGolongan: number;
  totalPeriodes: number;
}

export const GOLONGAN_LIST = [
  'I/a','I/b','I/c','I/d',
  'II/a','II/b','II/c','II/d',
  'III/a','III/b','III/c','III/d',
  'IV/a','IV/b','IV/c','IV/d','IV/e',
] as const;

export type GolonganKode = (typeof GOLONGAN_LIST)[number];

export function formatRupiah(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '—';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
}

export function listGajiPokok(golonganKode?: string, berlakuSejak?: string) {
  const params: Record<string, string> = {};
  if (golonganKode) params.golonganKode = golonganKode;
  if (berlakuSejak) params.berlakuSejak = berlakuSejak;
  return apiClient.get<GajiPokokRow[]>('/ref-gaji-pokok', Object.keys(params).length ? params : undefined);
}

export function getMatrix(berlakuSejak?: string) {
  return apiClient.get<GajiPokokMatrixItem[]>('/ref-gaji-pokok/matrix', berlakuSejak ? { berlakuSejak } : undefined);
}

export function lookupGajiPokok(golonganKode: string, masaKerja: number, berlakuSejak?: string) {
  const params: Record<string, string | number> = { golonganKode, masaKerja };
  if (berlakuSejak) params.berlakuSejak = berlakuSejak;
  return apiClient.get<GajiPokokLookupResult>('/ref-gaji-pokok/lookup', params);
}

export function getSummary() {
  return apiClient.get<GajiPokokSummary>('/ref-gaji-pokok/summary');
}

export function listPeriodes() {
  return apiClient.get<string[]>('/ref-gaji-pokok/periodes');
}

export function updateGajiPokok(id: number, gajiPokok: number) {
  return apiClient.patch<GajiPokokRow>(`/ref-gaji-pokok/${id}`, { gajiPokok });
}

export function importGajiPokok(records: Array<{ golonganKode: string; masaKerja: number; gajiPokok: number }>, berlakuSejak: string) {
  return apiClient.post<{ count: number }>('/ref-gaji-pokok/import', { records, berlakuSejak });
}

/**
 * Parse CSV: golonganKode,masaKerja,gajiPokok (header optional)
 */
export function parseCsvGajiPokok(text: string): Array<{ golonganKode: string; masaKerja: number; gajiPokok: number }> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const GOLONGAN_SET = new Set(GOLONGAN_LIST as readonly string[]);
  const results: Array<{ golonganKode: string; masaKerja: number; gajiPokok: number }> = [];

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
    if (parts.length < 3) continue;
    const [col1, col2, col3] = parts;
    if (col1.toLowerCase().includes('golongan') || col1.toLowerCase() === 'kode') continue;
    if (!GOLONGAN_SET.has(col1)) continue;
    const masaKerja = parseInt(col2, 10);
    const gajiPokok = parseFloat(col3);
    if (isNaN(masaKerja) || isNaN(gajiPokok) || gajiPokok <= 0) continue;
    results.push({ golonganKode: col1, masaKerja, gajiPokok });
  }
  return results;
}

export const refGajiPokokApi = {
  listGajiPokok,
  getMatrix,
  lookupGajiPokok,
  getSummary,
  listPeriodes,
  updateGajiPokok,
  importGajiPokok,
  parseCsvGajiPokok,
};
