const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const updated = await p.payment.updateMany({
    where: { isExempt: true, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() }
  });
  console.log("Atualizados:", updated.count, "pagamentos isentos para PAID");
  await p.$disconnect();
}
main();