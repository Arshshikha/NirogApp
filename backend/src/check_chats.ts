import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CONVERSATIONS DIAGNOSTIC ---');
  const conversations = await prisma.conversation.findMany({
    include: {
      members: {
        include: {
          user: {
            include: { profile: true }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  conversations.forEach((c: any) => {
    console.log(`Conversation ID: ${c.id}`);
    console.log(`  Members:`);
    c.members.forEach((m: any) => {
      console.log(`    - User ID: ${m.userId}, Email: ${m.user?.email}, Name: ${m.user?.profile?.firstName} ${m.user?.profile?.lastName}`);
    });
    console.log(`  Messages (${c.messages.length}):`);
    c.messages.forEach((msg: any) => {
      console.log(`    [${msg.senderType}] ${msg.body}`);
    });
    console.log('----------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
