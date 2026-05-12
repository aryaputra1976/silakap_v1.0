import 'dotenv/config';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { resolve } from 'path';
import { validateEnv } from '../src/config/env';

async function main() {
  const config = validateEnv();

  console.log('Predeploy check SILAKAP API');
  console.table({
    nodeEnv: config.nodeEnv,
    port: config.port,
    webOrigins: config.webOrigins.join(', '),
    requestBodyLimit: config.requestBodyLimit,
    uploadRoot: config.uploadRoot,
    uploadMaxSizeMb: config.uploadMaxSizeMb,
    securityHeadersEnabled: config.securityHeadersEnabled,
    trustProxy: config.trustProxy,
  });

  await ensureWritableUploadRoot(config.uploadRoot);
  await ensureMigrationsDirectory();

  if (config.nodeEnv === 'production') {
    ensureProductionRules(config);
  }

  console.log('Predeploy check selesai: OK');
}

async function ensureWritableUploadRoot(uploadRoot: string) {
  const absoluteUploadRoot = resolve(process.cwd(), uploadRoot);

  await mkdir(absoluteUploadRoot, { recursive: true });
  await access(absoluteUploadRoot, constants.R_OK | constants.W_OK);

  const testFile = resolve(
    absoluteUploadRoot,
    `.write-test-${Date.now()}.tmp`,
  );

  await writeFile(testFile, 'ok', 'utf8');
  await unlink(testFile);
}

async function ensureMigrationsDirectory() {
  const migrationsDir = resolve(process.cwd(), 'prisma', 'migrations');

  try {
    await access(migrationsDir, constants.R_OK);
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Folder prisma/migrations wajib ada untuk production migrate deploy',
      );
    }

    console.warn(
      'Peringatan: folder prisma/migrations belum ada. Ini masih boleh untuk local development, tetapi production wajib memakai migration.',
    );
  }
}

function ensureProductionRules(config: ReturnType<typeof validateEnv>) {
  if (config.webOrigins.some((origin) => origin.includes('localhost'))) {
    throw new Error('WEB_ORIGIN production tidak boleh localhost');
  }

  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET production minimal 32 karakter');
  }
}

main().catch((error) => {
  console.error('Predeploy check gagal');
  console.error(error);
  process.exit(1);
});