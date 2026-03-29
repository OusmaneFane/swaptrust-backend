import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

async function main() {
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

  console.log('Seed OK: admin@swaptrust.local / AdminSwapTrust123!');
  console.log('Seed OK: operator@swaptrust.local / OperatorSwapTrust123!');
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
