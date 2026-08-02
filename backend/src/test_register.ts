import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = `test_bg_${Date.now()}@gmail.com`;
  
  console.log('Sending test registration request for email:', email);
  
  // Call backend directly by invoking the DB operations just like the controller does
  // to isolate and verify if Prisma handles the mapping and writing correctly.
  
  const fName = 'Test';
  const lName = 'User';
  const role = 'Patient';
  const bloodGroup = 'O-positive';

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'testpass123',
      role: 'PATIENT',
      profile: {
        create: {
          firstName: fName,
          lastName: lName,
        }
      }
    }
  });

  // Map and write blood group using our new explicit mapping logic
  let bg: any = 'UNKNOWN';
  if (bloodGroup) {
    const cleanBg = String(bloodGroup).trim().toUpperCase().replace(/\s+/g, '');
    const mapping: any = {
      'A+': 'A_POSITIVE',
      'A-': 'A_NEGATIVE',
      'APOSITIVE': 'A_POSITIVE',
      'ANEGATIVE': 'A_NEGATIVE',
      'A-POSITIVE': 'A_POSITIVE',
      'A-NEGATIVE': 'A_NEGATIVE',

      'B+': 'B_POSITIVE',
      'B-': 'B_NEGATIVE',
      'BPOSITIVE': 'B_POSITIVE',
      'BNEGATIVE': 'B_NEGATIVE',
      'B-POSITIVE': 'B_POSITIVE',
      'B-NEGATIVE': 'B_NEGATIVE',

      'AB+': 'AB_POSITIVE',
      'AB-': 'AB_NEGATIVE',
      'ABPOSITIVE': 'AB_POSITIVE',
      'ABNEGATIVE': 'AB_NEGATIVE',
      'AB-POSITIVE': 'AB_POSITIVE',
      'AB-NEGATIVE': 'AB_NEGATIVE',

      'O+': 'O_POSITIVE',
      'O-': 'O_NEGATIVE',
      'OPOSITIVE': 'O_POSITIVE',
      'ONEGATIVE': 'O_NEGATIVE',
      'O-POSITIVE': 'O_POSITIVE',
      'O-NEGATIVE': 'O_NEGATIVE',
    };

    if (mapping[cleanBg]) {
      bg = mapping[cleanBg];
    }
  }

  const patientProfile = await prisma.patientProfile.create({
    data: { userId: user.id, bloodGroup: bg }
  });

  console.log('--- TEST WRITE COMPLETED ---');
  console.log('User created:', user.email);
  console.log('Patient Profile bloodGroup written:', patientProfile.bloodGroup);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
