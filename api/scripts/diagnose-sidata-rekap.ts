import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { SidataRepository } from '../src/modules/sidata/sidata.repository';

const prisma = new PrismaClient();
const prismaService = new PrismaService();
const sidataRepository = new SidataRepository(prismaService);

async function main() {
  const [total, active, byStatus, byTipe, profileGender, rawGenderSamples] = await Promise.all([
    prisma.asn.count({ where: { deletedAt: null } }),
    prisma.asn.count({ where: { deletedAt: null, isActive: true } }),
    prisma.asn.groupBy({
      by: ['statusAsn'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { _count: { statusAsn: 'desc' } },
      take: 20,
    }),
    prisma.asn.groupBy({
      by: ['tipePegawai', 'jenisPegawaiNama', 'jenisAsnNama'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { _count: { tipePegawai: 'desc' } },
      take: 30,
    }),
    prisma.$queryRaw<Array<{ jenis_kelamin_nama: string | null; total: bigint }>>(Prisma.sql`
      SELECT jenis_kelamin_nama, COUNT(*) AS total
      FROM asn_siasn_profile
      WHERE deleted_at IS NULL
      GROUP BY jenis_kelamin_nama
      ORDER BY total DESC
      LIMIT 20
    `),
    prisma.$queryRaw<Array<{
      jenis_kelamin_nama: string | null;
      raw_jk_id: string | null;
      raw_jk_nama: string | null;
      raw_jenis_kelamin: string | null;
      raw_jenis_kelamin_nama: string | null;
      raw_keys: string | null;
    }>>(Prisma.sql`
      SELECT
        jenis_kelamin_nama,
        JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.jenis_kelamin_id')) AS raw_jk_id,
        JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.jenis_kelamin_nama')) AS raw_jk_nama,
        JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.jenis_kelamin')) AS raw_jenis_kelamin,
        JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$."Jenis Kelamin"')) AS raw_jenis_kelamin_nama,
        JSON_KEYS(raw_data) AS raw_keys
      FROM asn_siasn_profile
      WHERE deleted_at IS NULL AND raw_data IS NOT NULL
      LIMIT 10
    `),
  ]);
  const [ikhtisar, pns, pppk] = await Promise.all([
    sidataRepository.findRekapIkhtisarData(),
    sidataRepository.findRekapPnsData(),
    sidataRepository.findRekapPppkData(),
  ]);
  const rawCount = await prisma.$queryRaw<Array<{ jk: unknown; cnt: unknown }>>(Prisma.sql`
    SELECT 'RAW' AS jk, COUNT(*) AS cnt
    FROM asn a
    WHERE a.deleted_at IS NULL
      AND (
        a.is_active = 1
        OR UPPER(COALESCE(a.status_asn, '')) IN ('AKTIF', 'ACTIVE')
        OR (
          UPPER(COALESCE(a.status_asn, '')) LIKE '%AKTIF%'
          AND UPPER(COALESCE(a.status_asn, '')) NOT LIKE '%TIDAK%AKTIF%'
          AND UPPER(COALESCE(a.status_asn, '')) NOT LIKE '%NON%AKTIF%'
        )
      )
  `);
  const rawValue = rawCount[0]?.cnt;

  console.log(JSON.stringify({
    total,
    active,
    byStatus: byStatus.map((row) => ({
      statusAsn: row.statusAsn,
      total: row._count._all,
    })),
    byTipe: byTipe.map((row) => ({
      tipePegawai: row.tipePegawai,
      jenisPegawaiNama: row.jenisPegawaiNama,
      jenisAsnNama: row.jenisAsnNama,
      total: row._count._all,
    })),
    profileGender: profileGender.map((row) => ({
      jenisKelaminNama: row.jenis_kelamin_nama,
      total: Number(row.total),
    })),
    rawGenderSamples,
    rekap: {
      rawCountDebug: {
        row: rawCount[0],
        typeofCnt: typeof rawValue,
        ctor: rawValue && typeof rawValue === 'object' ? rawValue.constructor?.name : null,
        stringValue: rawValue == null ? null : String(rawValue),
        numberValue: rawValue == null ? null : Number(rawValue),
        keys: rawValue && typeof rawValue === 'object' ? Object.keys(rawValue) : [],
      },
      ikhtisar: {
        allJk: ikhtisar.allJk,
        allJenjangJabatan: ikhtisar.allJenjangJabatan,
      },
      pns: {
        golonganGroup: pns.pnsGolonganGroup,
        pendidikanGroup: pns.pnsPendidikanGroup,
        fungsionalTotal: pns.fungsionalJabatan.reduce((sum, row) => sum + row.jumlahTotal, 0),
        fungsionalRows: pns.fungsionalJabatan.length,
      },
      pppk: {
        golonganTotal: pppk.pppkGolongan.reduce((sum, row) => sum + row.total, 0),
        paruhWaktuGolonganTotal: pppk.pppkParuhWaktuGolongan.reduce((sum, row) => sum + row.total, 0),
      },
    },
  }, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await prismaService.$disconnect();
  });
