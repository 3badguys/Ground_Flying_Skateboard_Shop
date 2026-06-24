import { PrismaClient } from '@prisma/client';

/**
 * Ensure exactly one SUPER_ADMIN exists with config from .env.
 * If a SUPER_ADMIN already exists, update its credentials to match the current config.
 * Safe to call on every startup — idempotent.
 */
export async function seedSuperAdmin(prisma: PrismaClient, logger?: { log: (msg: string) => void }) {
  const username = process.env.SUPER_ADMIN_USERNAME || 'admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
  const forceReset = process.env.SUPER_ADMIN_FORCE_RESET !== 'false';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcrypt');

  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existing) {
    // Update credentials to match current .env config
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        password: hashedPassword,
        mustResetPassword: forceReset,
      },
    });
    logger?.log(`SUPER_ADMIN updated: username="${username}"`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustResetPassword: forceReset,
      },
    });
    logger?.log(`SUPER_ADMIN created: username="${username}"`);
  }
}
