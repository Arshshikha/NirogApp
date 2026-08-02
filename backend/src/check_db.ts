import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const bookings = await prisma.booking.findMany({
    include: {
      patient: {
        include: { profile: true }
      },
      doctorProfile: {
        include: {
          user: {
            include: { profile: true }
          }
        }
      }
    }
  });
  console.log('--- ALL BOOKINGS ---');
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id}, Patient: ${b.patient?.profile?.firstName} (ID: ${b.patientId}), Doc: ${b.doctorProfile?.user?.profile?.firstName} (ProfileId: ${b.doctorProfileId})`);
  });

  const convs = await prisma.conversation.findMany({
    include: {
      members: {
        include: {
          user: {
            include: { profile: true }
          }
        }
      },
      messages: true
    }
  });
  console.log('\n--- CONVERSATIONS ---');
  convs.forEach(c => {
    const memberNames = c.members.map(m => `${m.user?.profile?.firstName || m.user?.email} (${m.userId})`).join(', ');
    console.log(`Conv ID: ${c.id}, Members: [${memberNames}], Message Count: ${c.messages.length}`);
    c.messages.forEach(m => {
      console.log(`  Msg: ${m.senderType} - ${m.body}`);
    });
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
