const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const payments = await p.payment.findMany({ select: { id: true, status: true, method: true }, orderBy: { updatedAt: "desc" }, take: 3 });
  console.log(JSON.stringify(payments, null, 2));
  await p.$disconnect();
}
main();