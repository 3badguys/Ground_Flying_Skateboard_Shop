import { PrismaClient } from '@prisma/client';
import { seedSuperAdmin } from '../src/prisma/seed-super-admin';

const prisma = new PrismaClient();

async function main() {
  await seedSuperAdmin(prisma, console);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
