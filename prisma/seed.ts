import 'dotenv/config';
import { PrismaClient, CountryResidence, KycStatus } from '@prisma/client';
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
      countryResidence: CountryResidence.MALI,
      kycStatus: KycStatus.VERIFIED,
      isAdmin: true,
    },
    update: {
      isAdmin: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const userPass = await bcrypt.hash('UserDemo123!', 12);
  await prisma.user.upsert({
    where: { email: 'demo@swaptrust.local' },
    create: {
      email: 'demo@swaptrust.local',
      name: 'Demo User',
      password: userPass,
      phoneMali: '+22370123456',
      countryResidence: CountryResidence.RUSSIA,
      kycStatus: KycStatus.VERIFIED,
    },
    update: {},
  });

  console.log('Seed OK: admin@swaptrust.local / AdminSwapTrust123!');
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
