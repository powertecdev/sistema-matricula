import { prisma } from "../config/prisma";
import { PaymentStatus } from "@prisma/client";

export class PaymentRepository {
  async findAll(page: number, limit: number) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          enrollment: {
            include: {
              student: { select: { id: true, registrationNumber: true, name: true } },
              classroom: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count(),
    ]);
    return { payments, total };
  }

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { enrollment: { include: { student: true, classroom: true } } },
    });
  }

  async create(data: { enrollmentId: string; amount: number; dueDate?: Date }) {
    return prisma.payment.create({ data: { ...data, status: "PENDING" } });
  }

  async updateStatus(id: string, status: PaymentStatus) {
    return prisma.payment.update({
      where: { id },
      data: { status, paidAt: status === "PAID" ? new Date() : null },
    });
  }
}
