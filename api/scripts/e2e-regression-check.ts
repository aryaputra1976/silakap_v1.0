import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
};

type DuplicateCandidateRow = {
  candidate_id: string;
  total: bigint;
};

const results: CheckResult[] = [];

async function main() {
  console.log('SILAKAP Sprint 30 E2E regression integrity check');

  await checkWorkingCalendar();
  await checkInactiveLegacyRoles();
  await checkCoreModelsReadable();
  await checkCandidateRealizationIntegrity();
  await checkSubmissionTimelineIntegrity();
  await checkDocumentIntegrity();
  await checkMigrationCriticalFolders();

  const failed = results.filter((item) => item.status === 'FAIL');
  const warned = results.filter((item) => item.status === 'WARN');

  console.table(results);
  console.log(`Summary: ${results.length} checks, ${failed.length} fail, ${warned.length} warn`);
  printOperationalHints(warned);

  if (failed.length > 0) {
    throw new Error('E2E regression integrity check gagal. Lihat baris FAIL.');
  }
}

function printOperationalHints(warned: CheckResult[]) {
  if (warned.some((item) => item.name === 'prisma.critical-migrations-applied')) {
    console.warn('Migration warning detected.');
    console.warn('Check status: npm run prisma:migrate:status');
    console.warn('Apply in staging/production after DB backup: npm run prisma:migrate:deploy');
  }

  if (warned.some((item) => item.name === 'working-calendar.default')) {
    console.warn('Working calendar warning detected.');
    console.warn('Run controlled seed or create default WorkingCalendar before go-live.');
  }
}

async function checkWorkingCalendar() {
  const defaultCalendar = await prisma.workingCalendar.findFirst({
    where: { isDefault: true, isActive: true },
    select: { id: true, name: true, timezone: true },
  });

  record(
    'working-calendar.default',
    Boolean(defaultCalendar),
    defaultCalendar
      ? `Default aktif: ${defaultCalendar.name} (${defaultCalendar.timezone})`
      : 'Tidak ada kalender kerja default aktif; fallback runtime masih tersedia tetapi production perlu seed default.',
    defaultCalendar ? 'PASS' : 'WARN',
  );
}

async function checkInactiveLegacyRoles() {
  const legacyRoles = await prisma.role.findMany({
    where: {
      code: { in: ['SEKRETARIS', 'AUDITOR'] },
      isActive: true,
    },
    select: { code: true },
  });

  record(
    'rbac.legacy-roles-disabled',
    legacyRoles.length === 0,
    legacyRoles.length === 0
      ? 'SEKRETARIS/AUDITOR tidak aktif.'
      : `Role tidak dipakai masih aktif: ${legacyRoles.map((role) => role.code).join(', ')}`,
  );
}

async function checkCoreModelsReadable() {
  const [
    submissions,
    documents,
    candidates,
    realizations,
    calendars,
    auditLogs,
  ] = await Promise.all([
    prisma.opdSubmission.count(),
    prisma.opdSubmissionDocument.count(),
    prisma.kinerjaRhkCandidate.count(),
    prisma.kinerjaRhkRealization.count(),
    prisma.workingCalendar.count(),
    prisma.auditLog.count(),
  ]);

  record(
    'prisma.models-readable',
    true,
    `submissions=${submissions}, documents=${documents}, candidates=${candidates}, realizations=${realizations}, calendars=${calendars}, auditLogs=${auditLogs}`,
  );
}

async function checkCandidateRealizationIntegrity() {
  const [
    approvedWithoutRealization,
    realizationFromNonApprovedCandidate,
    duplicateCandidateRows,
  ] = await Promise.all([
    prisma.kinerjaRhkCandidate.count({
      where: { status: 'APPROVED', realization: { is: null } },
    }),
    prisma.kinerjaRhkRealization.count({
      where: {
        candidateId: { not: null },
        candidate: { is: { status: { not: 'APPROVED' } } },
      },
    }),
    prisma.$queryRaw<DuplicateCandidateRow[]>`
      SELECT candidate_id, COUNT(*) AS total
      FROM kinerja_rhk_realizations
      WHERE candidate_id IS NOT NULL
      GROUP BY candidate_id
      HAVING COUNT(*) > 1
    `,
  ]);

  record(
    'rhk.approved-candidate-has-realization',
    approvedWithoutRealization === 0,
    `${approvedWithoutRealization} kandidat APPROVED tanpa realisasi.`,
  );
  record(
    'rhk.realization-only-from-approved-candidate',
    realizationFromNonApprovedCandidate === 0,
    `${realizationFromNonApprovedCandidate} realisasi terhubung ke kandidat non-APPROVED.`,
  );
  record(
    'rhk.no-duplicate-realization-per-candidate',
    duplicateCandidateRows.length === 0,
    duplicateCandidateRows.length === 0
      ? 'Tidak ada duplikasi candidateId pada realisasi.'
      : `Duplikasi candidateId: ${duplicateCandidateRows.map((row) => `${row.candidate_id}:${row.total}`).join(', ')}`,
  );
}

async function checkSubmissionTimelineIntegrity() {
  const completedWithoutTimeline = await prisma.opdSubmission.count({
    where: {
      status: 'COMPLETED',
      timelines: { none: { toStatus: 'COMPLETED' } },
    },
  });

  record(
    'opd.completed-has-completed-timeline',
    completedWithoutTimeline === 0,
    `${completedWithoutTimeline} submission COMPLETED tanpa timeline COMPLETED.`,
  );
}

async function checkDocumentIntegrity() {
  const orphanVerifiedDocuments = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total
    FROM opd_submission_documents d
    LEFT JOIN opd_submissions s ON s.id = d.submission_id
    WHERE d.status = 'VERIFIED' AND s.id IS NULL
  `;
  const total = Number(orphanVerifiedDocuments[0]?.total ?? 0n);

  record(
    'opd.verified-document-has-submission',
    total === 0,
    `${total} dokumen VERIFIED tanpa submission valid.`,
  );
}

async function checkMigrationCriticalFolders() {
  try {
    const migrations = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) AS total
      FROM _prisma_migrations
      WHERE migration_name IN (
        '20260518000000_add_opd_submission_document_file_metadata',
        '20260518001000_add_opd_submission_sla_timeline',
        '20260519000000_add_kinerja_rhk_realization_report',
        '20260519001000_add_working_calendar_sla_accuracy'
      )
    `;
    const total = Number(migrations[0]?.total ?? 0n);

    record(
      'prisma.critical-migrations-applied',
      total >= 4,
      `${total}/4 migration Sprint 24-29 terdeteksi di _prisma_migrations.`,
      total >= 4 ? 'PASS' : 'WARN',
    );
  } catch {
    record(
      'prisma.critical-migrations-applied',
      false,
      'Tabel _prisma_migrations tidak bisa dibaca; jalankan npx prisma migrate status untuk validasi resmi.',
      'WARN',
    );
  }
}

function record(
  name: string,
  passed: boolean,
  detail: string,
  nonFailStatus: 'PASS' | 'WARN' = 'PASS',
) {
  results.push({
    name,
    status: passed ? 'PASS' : nonFailStatus === 'WARN' ? 'WARN' : 'FAIL',
    detail,
  });
}

main()
  .catch((error) => {
    console.error('Sprint 30 E2E regression integrity check GAGAL');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
