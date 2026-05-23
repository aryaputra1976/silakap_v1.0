export type GajiPokokRow = {
  id: number;
  golonganKode: string;
  masaKerja: number;
  gajiPokok: string;
  berlakuSejak: string;
  updatedAt: string;
};

export type GajiPokokMatrixItem = {
  golonganKode: string;
  urutan: number;
  berlakuSejak: string;
  rows: Array<{
    id: number;
    masaKerja: number;
    gajiPokok: string;
  }>;
};

export type GajiPokokLookupResult = {
  golonganKode: string;
  masaKerja: number;
  gajiPokok: string;
  berlakuSejak: string;
};

export type ImportGajiPokokPayload = {
  golonganKode: string;
  masaKerja: number;
  gajiPokok: number;
};

// Urutan tampil golongan (I/a → IV/e)
export const GOLONGAN_ORDER: Record<string, number> = {
  'I/a': 1, 'I/b': 2, 'I/c': 3, 'I/d': 4,
  'II/a': 5, 'II/b': 6, 'II/c': 7, 'II/d': 8,
  'III/a': 9, 'III/b': 10, 'III/c': 11, 'III/d': 12,
  'IV/a': 13, 'IV/b': 14, 'IV/c': 15, 'IV/d': 16, 'IV/e': 17,
};
