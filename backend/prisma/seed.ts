import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();
async function main() {
  console.log("Seeding...");
  const classrooms = await Promise.all([
    prisma.classroom.create({ data: { name: "Turma A - Manha", maxCapacity: 30 } }),
    prisma.classroom.create({ data: { name: "Turma B - Tarde", maxCapacity: 25 } }),
    prisma.classroom.create({ data: { name: "Turma C - Noite", maxCapacity: 20 } }),
  ]);
  const now = new Date();
  const future = new Date(now.getTime() + 30*24*60*60*1000);
  const past = new Date(now.getTime() - 5*24*60*60*1000);
  const qr1 = randomUUID(), qr2 = randomUUID(), qr3 = randomUUID();
  const s1 = await prisma.student.create({ data: { registrationNumber: "MAT-0001", name: "Joao Silva", age: 22, address: "Rua das Flores 123", phone: "(13)99999-0001", qrCode: qr1 }});
  const s2 = await prisma.student.create({ data: { registrationNumber: "MAT-0002", name: "Maria Oliveira", age: 19, address: "Av Brasil 456", phone: "(13)99999-0002", qrCode: qr2 }});
  const s3 = await prisma.student.create({ data: { registrationNumber: "MAT-0003", name: "Carlos Pereira", age: 25, address: "Rua Sete de Setembro 789", phone: "(13)99999-0003", qrCode: qr3 }});
  const e1 = await prisma.enrollment.create({ data: { studentId: s1.id, classroomId: classrooms[0].id, status: "ACTIVE" }});
  const e2 = await prisma.enrollment.create({ data: { studentId: s2.id, classroomId: classrooms[0].id, status: "ACTIVE" }});
  const e3 = await prisma.enrollment.create({ data: { studentId: s3.id, classroomId: classrooms[1].id, status: "ACTIVE" }});
  await prisma.payment.createMany({ data: [
    { enrollmentId: e1.id, status: "PAID", amount: 500, paidAt: now, validUntil: future },
    { enrollmentId: e2.id, status: "PENDING", amount: 500 },
    { enrollmentId: e3.id, status: "PAID", amount: 450, paidAt: now, validUntil: past },
  ]});
  console.log("Seed completo!");
  console.log("MAT-0001 PAGO+VALIDO -> AUTORIZADO");
  console.log("MAT-0002 PENDENTE -> BLOQUEADO");
  console.log("MAT-0003 PAGO+VENCIDO -> BLOQUEADO");
  console.log("QR Codes:"); console.log("Joao:", qr1); console.log("Maria:", qr2); console.log("Carlos:", qr3);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma["$disconnect"]());