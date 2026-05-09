export type SidataAsnQuery = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  page?: string;
  limit?: string;
};

export type NormalizedAsnFilters = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  page: number;
  limit: number;
};

export type UnitTreeNode = {
  id: string;
  kode: string;
  nama: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  children: UnitTreeNode[];
};
