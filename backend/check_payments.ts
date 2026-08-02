import { db } from './src/config/db';

async function main() {
  try {
    const payments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { booking: true }
    });
    console.log("LAST 5 PAYMENTS:");
    console.log(JSON.stringify(payments, null, 2));
  } catch (err) {
    console.error("Error fetching payments:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
