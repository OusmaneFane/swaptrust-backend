import { PrismaClient, KycStatus } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const result = await prisma.user.updateMany({
    where: {
      kycStatus: { in: [KycStatus.NOT_SUBMITTED, KycStatus.PENDING, KycStatus.REJECTED] },
    },
    data: { kycStatus: KycStatus.VERIFIED },
  });
  // eslint-disable-next-line no-console
  console.log(`✅ ${result.count} utilisateurs mis à jour → VERIFIED`);
  await prisma.$disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

