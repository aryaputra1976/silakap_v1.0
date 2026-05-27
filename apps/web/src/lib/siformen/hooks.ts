import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  siformenApi,
  type ProyeksiQuery,
  type BupQuery,
  type UpsertBupPayload,
  type JabatanQuery,
  type JabatanFungsionalRefQuery,
  type BezettingQuery,
  type AbkQuery,
  type CreateJabatanPayload,
  type UpdateJabatanPayload,
  type CreateJabatanFungsionalRefPayload,
  type UpdateJabatanFungsionalRefPayload,
  type CreateBezettingPayload,
  type UpdateBezettingPayload,
  type CreateAbkPayload,
  type UpdateAbkPayload,
} from '@/lib/api/siformen';

export const SIFORMEN_KEYS = {
  proyeksiSummary: () => ['siformen', 'proyeksi', 'summary'] as const,
  proyeksi: (q: ProyeksiQuery) => ['siformen', 'proyeksi', q] as const,
  bupList: (q: BupQuery) => ['siformen', 'bup', 'list', q] as const,
  bupPerJabatan: (jabatanId: string) => ['siformen', 'bup', 'jabatan', jabatanId] as const,
  rekapPegawai: () => ['siformen', 'rekap-pegawai'] as const,
  jabatanList: (q: JabatanQuery) => ['siformen', 'jabatan', 'list', q] as const,
  jabatanFungsionalRefList: (q: JabatanFungsionalRefQuery) => ['siformen', 'jabatan-fungsional-ref', 'list', q] as const,
  jabatanFungsionalRefFilterOptions: () => ['siformen', 'jabatan-fungsional-ref', 'filter-options'] as const,
  bezettingList: (q: BezettingQuery) => ['siformen', 'bezetting', 'list', q] as const,
  abkList: (q: AbkQuery) => ['siformen', 'abk', 'list', q] as const,
};

// ── Proyeksi ──────────────────────────────────────────────────────────────────

export function useProyeksiSummary() {
  return useQuery({
    queryKey: SIFORMEN_KEYS.proyeksiSummary(),
    queryFn: () => siformenApi.getProyeksiSummary(),
  });
}

export function useProyeksi(query: ProyeksiQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.proyeksi(query),
    queryFn: () => siformenApi.getProyeksi(query),
  });
}

// ── BUP ───────────────────────────────────────────────────────────────────────

export function useBupList(query: BupQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.bupList(query),
    queryFn: () => siformenApi.getBupList(query),
  });
}

export function useBupPerJabatan(jabatanId: string | undefined) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.bupPerJabatan(jabatanId ?? ''),
    queryFn: () => siformenApi.getBupPerJabatan(jabatanId!),
    enabled: !!jabatanId,
  });
}

export function useUpsertBup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertBupPayload) => siformenApi.upsertBup(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: SIFORMEN_KEYS.bupPerJabatan(vars.jabatanId) });
      qc.invalidateQueries({ queryKey: SIFORMEN_KEYS.proyeksiSummary() });
      qc.invalidateQueries({ queryKey: ['siformen', 'proyeksi'] });
    },
  });
}

export function useGenerateBupFromAsn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tahunMulai, tahunAkhir }: { tahunMulai?: number; tahunAkhir?: number }) =>
      siformenApi.generateBupFromAsn(tahunMulai, tahunAkhir),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siformen'] });
    },
  });
}

// ── Rekap Pegawai ─────────────────────────────────────────────────────────────

export function useRekapPegawai() {
  return useQuery({
    queryKey: SIFORMEN_KEYS.rekapPegawai(),
    queryFn: () => siformenApi.getRekapPegawai(),
  });
}

// ── Jabatan ───────────────────────────────────────────────────────────────────

export function useJabatanList(query: JabatanQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.jabatanList(query),
    queryFn: () => siformenApi.listJabatan(query),
  });
}

export function useCreateJabatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJabatanPayload) => siformenApi.createJabatan(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

export function useUpdateJabatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJabatanPayload }) =>
      siformenApi.updateJabatan(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

export function useDeleteJabatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siformenApi.deleteJabatan(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

export function useGenerateJabatanFromUnitKerja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => siformenApi.generateJabatanFromUnitKerja(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

export function useSyncJabatanFromAsn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => siformenApi.syncJabatanFromAsn(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

export function useAddJabatanFromRef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { refId: string; unitKerja: string; kodeJabatan?: string }) =>
      siformenApi.addJabatanFromRef(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan'] }); },
  });
}

// ── Jabatan Fungsional Ref ────────────────────────────────────────────────────

export function useJabatanFungsionalRefList(query: JabatanFungsionalRefQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.jabatanFungsionalRefList(query),
    queryFn: () => siformenApi.listJabatanFungsionalRef(query),
  });
}

export function useJabatanFungsionalRefFilterOptions() {
  return useQuery({
    queryKey: SIFORMEN_KEYS.jabatanFungsionalRefFilterOptions(),
    queryFn: () => siformenApi.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateJabatanFungsionalRef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJabatanFungsionalRefPayload) =>
      siformenApi.createJabatanFungsionalRef(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan-fungsional-ref'] }); },
  });
}

export function useUpdateJabatanFungsionalRef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJabatanFungsionalRefPayload }) =>
      siformenApi.updateJabatanFungsionalRef(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan-fungsional-ref'] }); },
  });
}

export function useDeleteJabatanFungsionalRef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siformenApi.deleteJabatanFungsionalRef(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan-fungsional-ref'] }); },
  });
}

export function useBulkImportJabatanFungsionalRef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateJabatanFungsionalRefPayload[]) =>
      siformenApi.bulkImportJabatanFungsionalRef(items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'jabatan-fungsional-ref'] }); },
  });
}

// ── Bezetting ─────────────────────────────────────────────────────────────────

export function useBezettingList(query: BezettingQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.bezettingList(query),
    queryFn: () => siformenApi.listBezetting(query),
  });
}

export function useCreateBezetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBezettingPayload) => siformenApi.createBezetting(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'bezetting'] }); },
  });
}

export function useUpdateBezetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBezettingPayload }) =>
      siformenApi.updateBezetting(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'bezetting'] }); },
  });
}

export function useDeleteBezetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siformenApi.deleteBezetting(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'bezetting'] }); },
  });
}

export function useGenerateBezettingFromJabatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tahun: number) => siformenApi.generateBezettingFromJabatan(tahun),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'bezetting'] }); },
  });
}

// ── ABK ───────────────────────────────────────────────────────────────────────

export function useAbkList(query: AbkQuery = {}) {
  return useQuery({
    queryKey: SIFORMEN_KEYS.abkList(query),
    queryFn: () => siformenApi.listAbk(query),
  });
}

export function useCreateAbk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAbkPayload) => siformenApi.createAbk(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'abk'] }); },
  });
}

export function useUpdateAbk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAbkPayload }) =>
      siformenApi.updateAbk(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'abk'] }); },
  });
}

export function useDeleteAbk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siformenApi.deleteAbk(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siformen', 'abk'] }); },
  });
}
