import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNOSTIC DATA ---');
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      patientProfile: true
    }
  });

  users.forEach((u: any) => {
    console.log(`Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Created At: ${u.createdAt}`);
    console.log(`  Profile Bio (Age): ${u.profile?.bio}`);
    console.log(`  Patient Blood Group: ${u.patientProfile?.bloodGroup}`);
    console.log('----------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
