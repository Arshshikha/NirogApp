import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  console.log('=== REGISTERED USERS ===');
  users.forEach(u => {
    console.log(`- Email: ${u.email}`);
    console.log(`  Password: ${u.passwordHash}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Name: ${u.profile?.firstName} ${u.profile?.lastName}`);
    console.log('------------------------');
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
