import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
export async function seedDemo(){
  try {
    const production = process.env.NODE_ENV === 'production';
    const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || (production ? '' : 'admin@example.com')).trim().toLowerCase();
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || (production ? '' : 'Demo1234!');

    if (production && Boolean(adminEmail) !== Boolean(adminPassword)) {
      throw new Error('Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create the production admin account.');
    }

    if (adminEmail && adminPassword) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN', active: true },
        create: {
          email: adminEmail,
          name: 'Administración',
          role: 'ADMIN',
          passwordHash: hash,
          demoBalance: 100000,
        },
      });
    }

    if (!production) {
      const password = process.env.LOCAL_DEMO_PASSWORD || 'Demo1234!';
      const hash = await bcrypt.hash(password, 12);
      await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
          email: 'demo@example.com',
          name: 'Demo User',
          passwordHash: hash,
          demoBalance: 100000,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
