import 'dotenv/config';
import { PaymentMethod, PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import { mysqlConnectionUrl } from '../src/prisma/mysql-connection-url';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required for seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(mysqlConnectionUrl(url)),
});

/** Compte admin (rôle ADMIN) — seul bloc exécuté si `SEED_ONLY=admin`. */
async function seedSuperAdmin() {
  const password = await bcrypt.hash('AdminSwapTrust123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@swaptrust.local' },
    create: {
      email: 'admin@swaptrust.local',
      name: 'Admin SwapTrust',
      password,
      countryResidence: 'MALI',
      kycStatus: 'VERIFIED',
      role: 'ADMIN',
    } as any,
    update: {
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
    } as any,
  });
}

async function main() {
  const seedOnly = (process.env.SEED_ONLY ?? '').trim().toLowerCase();
  if (seedOnly === 'admin' || seedOnly === 'superadmin') {
    await seedSuperAdmin();
    console.log(
      'Seed OK (admin uniquement): admin@swaptrust.local / AdminSwapTrust123!',
    );
    return;
  }

  await seedSuperAdmin();

  const userPass = await bcrypt.hash('UserDemo123!', 12);
  await prisma.user.upsert({
    where: { email: 'demo@swaptrust.local' },
    create: {
      email: 'demo@swaptrust.local',
      name: 'Demo User',
      password: userPass,
      phoneMali: '+22370123456',
      countryResidence: 'RUSSIA',
      kycStatus: 'VERIFIED',
    } as any,
    update: {},
  });

  const opPass = await bcrypt.hash('OperatorSwapTrust123!', 12);
  await prisma.user.upsert({
    where: { email: 'operator@swaptrust.local' },
    create: {
      email: 'operator@swaptrust.local',
      name: 'Operator Demo',
      password: opPass,
      countryResidence: 'MALI',
      kycStatus: 'VERIFIED',
      role: 'OPERATOR',
    } as any,
    update: {
      role: 'OPERATOR',
      kycStatus: 'VERIFIED',
    } as any,
  });

  const platformRows: Array<{
    method: PaymentMethod;
    accountNumber: string;
    accountName: string;
  }> = [
    {
      method: PaymentMethod.ORANGE_MONEY,
      accountNumber: process.env.SWAPTRUST_ORANGE_MONEY || '+22370000000',
      accountName: 'SwapTrust — Orange Money',
    },
    {
      method: PaymentMethod.WAVE,
      accountNumber: process.env.SWAPTRUST_WAVE || '+22380000000',
      accountName: 'SwapTrust — Wave',
    },
    {
      method: PaymentMethod.BANK_TRANSFER,
      accountNumber: process.env.SWAPTRUST_BANK_IBAN || 'ML00XXXXXXXXXXXX',
      accountName:
        process.env.SWAPTRUST_BANK_NAME || 'SwapTrust — Virement BHM',
    },
  ];

  for (const row of platformRows) {
    const existing = await prisma.platformAccount.findFirst({
      where: { method: row.method },
    });
    if (existing) {
      await prisma.platformAccount.update({
        where: { id: existing.id },
        data: {
          accountNumber: row.accountNumber,
          accountName: row.accountName,
          isActive: true,
        },
      });
    } else {
      await prisma.platformAccount.create({ data: row });
    }
  }

  console.log('Seed OK (complet): admin@swaptrust.local / AdminSwapTrust123!');
  console.log('Seed OK (complet): operator@swaptrust.local / OperatorSwapTrust123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
