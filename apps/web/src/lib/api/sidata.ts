import { apiClient } from './client';
import type { AsnRecord, PaginatedResult } from './types';

export type SidataUnitKerja = {
  id: string;
  kode: string;
  nama: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
};

export type SidataUnitTreeNode = SidataUnitKerja & {
  children: SidataUnitTreeNode[];
};

export type SidataAsnListQuery = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  jenisAsn?: string;
  page?: number;
  limit?: number;
};

export const SIDATA_STATUS_ASN_OPTIONS = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'PENSIUN', label: 'Pensiun' },
  { value: 'CLTN', label: 'CLTN' },
  { value: 'BERHENTI', label: 'Berhenti' },
  { value: 'MENINGGAL', label: 'Meninggal' },
] as const;

export const SIDATA_JENIS_ASN_OPTIONS = [
  { value: 'PNS', label: 'PNS' },
  { value: 'PPPK', label: 'PPPK' },
] as const;

export const sidataApi = {
  getAsnList(query: SidataAsnListQuery): Promise<PaginatedResult<AsnRecord>> {
    return apiClient.get<PaginatedResult<AsnRecord>>('/sidata/asn', {
      q: query.q,
      unitKerjaId: query.unitKerjaId,
      statusAsn: query.statusAsn,
      jenisAsn: query.jenisAsn,
      page: query.page,
      limit: query.limit,
    });
  },

  getAsnById(id: string): Promise<AsnRecord> {
    return apiClient.get<AsnRecord>(`/sidata/asn/${id}`);
  },

  getUnits(): Promise<SidataUnitKerja[]> {
    return apiClient.get<SidataUnitKerja[]>('/sidata/units');
  },

  getUnitTree(): Promise<SidataUnitTreeNode[]> {
    return apiClient.get<SidataUnitTreeNode[]>('/sidata/units/tree');
  },
};
