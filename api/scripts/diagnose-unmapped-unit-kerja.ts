import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeRawDataKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key.trim().toLowerCase().replace(/\s+/g, '_')] = value;
  }
  return out;
}

function pickRaw(raw: Record<string, unknown>, candidates: string[]): string | null {
  for (const key of candidates) {
    const value = raw[key.trim().toLowerCase().replace(/\s+/g, '_')];
    if (value !== null && value !== undefined) {
      const text = String(value).trim();
      if (text && text !== 'null' && text !== 'undefined') return text;
    }
  }
  return null;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitUnitName(value: string): string[] {
  return value
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function meaningfulTerms(value: string): string[] {
  const ignored = new Set(['dan', 'yang', 'pada', 'dengan', 'kab', 'kabupaten', 'pemerintah', 'tolitoli']);
  return normalizeText(value)
    .split(' ')
    .map((term) => term.trim())
    .filter((term) => term.length >= 5 && !ignored.has(term));
}

function normalizeUnitCode(value: string): string {
  return value.trim().toLowerCase();
}

async function main() {
  const batchId = process.argv[2];
  if (!batchId) {
    throw new Error('Usage: npm run db:diagnose-unmapped-unit-kerja -- <batch-id>');
  }

  const rows = await prisma.sidataAsnImportStaging.findMany({
    where: {
      batchId,
      mappingStatus: 'NEEDS_REVIEW',
    },
    orderBy: { rowNumber: 'asc' },
    select: {
      rowNumber: true,
      nip: true,
      nama: true,
      kdUnor: true,
      namaUnorEselon1: true,
      namaUnorEselon2: true,
      namaUnorEselon3: true,
      namaUnorEselon4: true,
      namaJabatan: true,
      rawData: true,
      validationErrors: true,
    },
  });

  const allUnits = await prisma.unitKerja.findMany({
    select: {
      id: true,
      kode: true,
      nama: true,
      level: true,
      parentId: true,
      parent: { select: { nama: true } },
      isActive: true,
      deletedAt: true,
    },
  });

  const activeByNormalizedCode = new Map(
    allUnits
      .filter((unit) => !unit.deletedAt)
      .map((unit) => [normalizeUnitCode(unit.kode), unit]),
  );
  const anyByNormalizedCode = new Map(
    allUnits.map((unit) => [normalizeUnitCode(unit.kode), unit]),
  );

  const report = rows.map((row) => {
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const rawNames = [
      pickRaw(raw, ['unor_nama', 'nama_unor', 'unit_organisasi_nama']),
      pickRaw(raw, ['unor_induk_nama', 'nama_unor_induk']),
      pickRaw(raw, ['satuan_kerja_nama', 'satker_nama']),
      pickRaw(raw, ['instansi_kerja_nama', 'instansi_nama']),
      row.namaUnorEselon4,
      row.namaUnorEselon3,
      row.namaUnorEselon2,
      row.namaUnorEselon1,
    ].filter(Boolean) as string[];

    const uniqueNames = [...new Set(rawNames)];
    const nameMatches = uniqueNames.flatMap((name) => {
      const normalized = normalizeText(name);
      return allUnits
        .filter((unit) => !unit.deletedAt && normalizeText(unit.nama) === normalized)
        .slice(0, 5)
        .map((unit) => ({
          sourceName: name,
          kode: unit.kode,
          nama: unit.nama,
          level: unit.level,
        }));
    });
    const fuzzyNameMatches = uniqueNames.flatMap((name) =>
      splitUnitName(name).flatMap((part) => {
        const normalizedPart = normalizeText(part);
        if (normalizedPart.length < 5) return [];
        return allUnits
          .filter((unit) => {
            if (unit.deletedAt) return false;
            const normalizedUnit = normalizeText(unit.nama);
            return normalizedUnit === normalizedPart ||
              normalizedUnit.includes(normalizedPart) ||
              normalizedPart.includes(normalizedUnit);
          })
          .slice(0, 8)
          .map((unit) => ({
            sourcePart: part,
            kode: unit.kode,
            nama: unit.nama,
            level: unit.level,
            parent: unit.parent?.nama ?? null,
          }));
      }),
    );
    const termMatches = uniqueNames.flatMap((name) => {
      const terms = meaningfulTerms(name);
      if (terms.length === 0) return [];
      return allUnits
        .filter((unit) => {
          if (unit.deletedAt) return false;
          const unitName = normalizeText(unit.nama);
          return terms.some((term) => unitName.includes(term));
        })
        .slice(0, 20)
        .map((unit) => ({
          sourceName: name,
            kode: unit.kode,
            nama: unit.nama,
            level: unit.level,
            parent: unit.parent?.nama ?? null,
          }));
    });

    const activeCodeMatch = row.kdUnor ? activeByNormalizedCode.get(row.kdUnor) : null;
    const anyCodeMatch = row.kdUnor ? anyByNormalizedCode.get(row.kdUnor) : null;

    return {
      rowNumber: row.rowNumber,
      nip: row.nip,
      nama: row.nama,
      jabatan: row.namaJabatan,
      kdUnor: row.kdUnor,
      activeCodeMatch: activeCodeMatch
        ? {
          kode: activeCodeMatch.kode,
          nama: activeCodeMatch.nama,
          level: activeCodeMatch.level,
          parent: activeCodeMatch.parent?.nama ?? null,
        }
        : null,
      deletedOrInactiveCodeMatch: !activeCodeMatch && anyCodeMatch
        ? {
            kode: anyCodeMatch.kode,
            nama: anyCodeMatch.nama,
            level: anyCodeMatch.level,
            parent: anyCodeMatch.parent?.nama ?? null,
            isActive: anyCodeMatch.isActive,
            deletedAt: anyCodeMatch.deletedAt,
          }
        : null,
      namesFromRow: uniqueNames,
      nameMatches,
      fuzzyNameMatches,
      termMatches,
      validationErrors: row.validationErrors,
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
