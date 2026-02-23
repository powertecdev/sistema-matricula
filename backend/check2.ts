const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const payments = await p.payment.findMany({
    select: { id: true, status: true, isExempt: true, exemptReason: true, amount: true, enrollment: { select: { student: { select: { name: true } } } } }
  });
  console.log(JSON.stringify(payments, null, 2));
  await p.$disconnect();
}
main();