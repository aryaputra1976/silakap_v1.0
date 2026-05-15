import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batchId = process.argv[2];
  const batch = batchId
    ? await prisma.sidataAsnImportBatch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          fileName: true,
          status: true,
          totalRows: true,
        },
      })
    : await prisma.sidataAsnImportBatch.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          status: true,
          totalRows: true,
        },
      });

  if (!batch) {
    console.log('Batch ASN tidak ditemukan.');
    return;
  }

  const rows = await prisma.sidataAsnImportStaging.findMany({
    where: { batchId: batch.id, mappingStatus: 'NEEDS_REVIEW' },
    select: {
      validationErrors: true,
      namaJabatan: true,
      jenisJabatan: true,
      namaGolongan: true,
      namaRuang: true,
      pendidikanTerakhir: true,
      agama: true,
      statusKawin: true,
      kedudukanHukum: true,
      jenisAsn: true,
      jenisKelamin: true,
      kdUnor: true,
      namaUnorEselon4: true,
      rawData: true,
    },
  });

  const counts = new Map<string, number>();
  const samples = new Map<string, string[]>();
  const values = new Map<string, Map<string, number>>();

  const valueForError = (error: string, row: (typeof rows)[number]) => {
    if (error.includes('pendidikan')) return row.pendidikanTerakhir;
    if (error.includes('jabatan')) return row.namaJabatan;
    if (error.includes('unit organisasi')) return row.kdUnor ?? row.namaUnorEselon4;
    if (error.includes('golongan')) return row.namaGolongan;
    if (error.includes('pangkat')) return row.namaRuang;
    if (error.includes('agama')) return row.agama;
    if (error.includes('status kawin')) return row.statusKawin;
    if (error.includes('kedudukan hukum')) return row.kedudukanHukum;
    if (error.includes('jenis ASN')) return row.jenisAsn;
    if (error.includes('jenis kelamin')) return row.jenisKelamin;
    return null;
  };

  for (const row of rows) {
    const errors = Array.isArray(row.validationErrors)
      ? (row.validationErrors as string[])
      : [];

    for (const error of errors) {
      counts.set(error, (counts.get(error) ?? 0) + 1);

      const value = valueForError(error, row);
      if (value) {
        const valueCounts = values.get(error) ?? new Map<string, number>();
        valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
        values.set(error, valueCounts);
      }

      const list = samples.get(error) ?? [];
      if (list.length < 5) {
        list.push(
          JSON.stringify({
            jabatan: row.namaJabatan,
            jenis: row.jenisJabatan,
            golongan: row.namaGolongan,
            pangkat: row.namaRuang,
            pendidikan: row.pendidikanTerakhir,
            agama: row.agama,
            statusKawin: row.statusKawin,
            kedudukanHukum: row.kedudukanHukum,
            jenisAsn: row.jenisAsn,
            jenisKelamin: row.jenisKelamin,
            kdUnor: row.kdUnor,
            unor4: row.namaUnorEselon4,
          }),
        );
      }
      samples.set(error, list);
    }
  }

  const topValues = Object.fromEntries(
    [...values.entries()].map(([error, map]) => [
      error,
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
    ]),
  );

  const topPendidikan = (topValues['Referensi pendidikan belum termapping'] ?? [])
    .slice(0, 10)
    .map(([name]) => name);
  const pendidikanPresence = topPendidikan.length
    ? await prisma.refPendidikan.findMany({
        where: { nama: { in: topPendidikan } },
        select: { kode: true, nama: true },
        orderBy: { nama: 'asc' },
      })
    : [];

  const firstEducationIssue = rows.find((row) =>
    Array.isArray(row.validationErrors) &&
    (row.validationErrors as string[]).includes('Referensi pendidikan belum termapping'),
  );

  const allJabatanCandidates = await prisma.refJabatan.findMany({
    where: { deletedAt: null },
    select: { kode: true, siasnKode: true, nama: true, namaNormalized: true },
    take: 20_000,
  });
  const jabatanPresence = await Promise.all(
    ((topValues['Referensi jabatan belum termapping'] ?? []) as [string, number][])
      .slice(0, 20)
      .map(async ([name]) => {
        const normalized = normalizeText(name);
        const stripped = stripPunctuation(name);
        const exact = await prisma.refJabatan.findFirst({
          where: { deletedAt: null, namaNormalized: normalized },
          select: { kode: true, siasnKode: true, nama: true },
        });
        const strippedMatch = allJabatanCandidates.find((candidate) =>
          stripPunctuation(candidate.namaNormalized) === stripped,
        );
        const contains = allJabatanCandidates
          .filter((candidate) => {
            const candidateNorm = stripPunctuation(candidate.namaNormalized);
            return candidateNorm.includes(stripped) || stripped.includes(candidateNorm);
          })
          .slice(0, 5)
          .map((candidate) => ({
            kode: candidate.kode,
            siasnKode: candidate.siasnKode,
            nama: candidate.nama,
          }));

        return {
          name,
          exact: exact ?? null,
          strippedMatch: strippedMatch
            ? {
                kode: strippedMatch.kode,
                siasnKode: strippedMatch.siasnKode,
                nama: strippedMatch.nama,
              }
            : null,
          contains,
        };
      }),
  );

  console.log(JSON.stringify(
    {
      batch,
      needsReviewRows: rows.length,
      counts: [...counts.entries()].sort((a, b) => b[1] - a[1]),
      topValues,
      jabatanPresence,
      pendidikanPresence,
      firstEducationIssueRawKeys:
        firstEducationIssue?.rawData && typeof firstEducationIssue.rawData === 'object'
          ? Object.keys(firstEducationIssue.rawData as Record<string, unknown>)
          : [],
      samples: Object.fromEntries(samples),
    },
    null,
    2,
  ));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stripPunctuation(value: string): string {
  return value.toLowerCase().replace(/[.,'\-\/\\()]/g, ' ').replace(/\s+/g, ' ').trim();
}
