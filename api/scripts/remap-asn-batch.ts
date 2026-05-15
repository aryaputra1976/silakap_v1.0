import { PrismaService } from '../src/modules/prisma/prisma.service';
import { SidataImportRepository } from '../src/modules/sidata/sidata-import.repository';

const prisma = new PrismaService();
const repository = new SidataImportRepository(prisma);

async function main() {
  const batchId = process.argv[2];
  if (!batchId) {
    throw new Error('Usage: npm run db:remap-asn-batch -- <batch-id>');
  }

  const result = await repository.mapSiasnAsnBatch({ batchId });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
