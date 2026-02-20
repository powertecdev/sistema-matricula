import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  const classrooms = await Promise.all([
    prisma.classroom.upsert({
      where: { name: "Turma A - Manhã" },
      update: {},
      create: { name: "Turma A - Manhã", maxCapacity: 30 },
    }),
    prisma.classroom.upsert({
      where: { name: "Turma B - Tarde" },
      update: {},
      create: { name: "Turma B - Tarde", maxCapacity: 25 },
    }),
    prisma.classroom.upsert({
      where: { name: "Turma C - Noite" },
      update: {},
      create: { name: "Turma C - Noite", maxCapacity: 20 },
    }),
  ]);

  const student1 = await prisma.student.upsert({
    where: { registrationNumber: "MAT-0001" },
    update: {},
    create: {
      registrationNumber: "MAT-0001",
      name: "João Silva Santos",
      age: 22,
      address: "Rua das Flores, 123 - Centro",
      phone: "(13) 99999-0001",
    },
  });

  const student2 = await prisma.student.upsert({
    where: { registrationNumber: "MAT-0002" },
    update: {},
    create: {
      registrationNumber: "MAT-0002",
      name: "Maria Oliveira Costa",
      age: 19,
      address: "Av. Brasil, 456 - Vila Nova",
      phone: "(13) 99999-0002",
    },
  });

  const student3 = await prisma.student.upsert({
    where: { registrationNumber: "MAT-0003" },
    update: {},
    create: {
      registrationNumber: "MAT-0003",
      name: "Carlos Eduardo Pereira",
      age: 25,
      address: "Rua Sete de Setembro, 789",
      phone: "(13) 99999-0003",
    },
  });

  const e1 = await prisma.enrollment.upsert({
    where: { studentId_classroomId: { studentId: student1.id, classroomId: classrooms[0].id } },
    update: {},
    create: { studentId: student1.id, classroomId: classrooms[0].id, status: "ACTIVE" },
  });

  const e2 = await prisma.enrollment.upsert({
    where: { studentId_classroomId: { studentId: student2.id, classroomId: classrooms[0].id } },
    update: {},
    create: { studentId: student2.id, classroomId: classrooms[0].id, status: "ACTIVE" },
  });

  const e3 = await prisma.enrollment.upsert({
    where: { studentId_classroomId: { studentId: student3.id, classroomId: classrooms[1].id } },
    update: {},
    create: { studentId: student3.id, classroomId: classrooms[1].id, status: "ACTIVE" },
  });

  await prisma.payment.createMany({
    data: [
      { enrollmentId: e1.id, status: "PAID", amount: 500, paidAt: new Date() },
      { enrollmentId: e2.id, status: "PENDING", amount: 500 },
      { enrollmentId: e3.id, status: "PAID", amount: 450, paidAt: new Date() },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completo!");
  console.log("   Alunos de teste:");
  console.log("   MAT-0001 (João)   → PAGO    → 🟢 AUTORIZADO");
  console.log("   MAT-0002 (Maria)  → PENDENTE → 🔴 BLOQUEADO");
  console.log("   MAT-0003 (Carlos) → PAGO    → 🟢 AUTORIZADO\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
