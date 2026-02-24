import { prisma } from "../config/prisma";
import { PaymentStatus } from "@prisma/client";

export class PaymentRepository {
  async findAll(page: number, limit: number) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: { enrollment: { include: { student: { select: { id: true, registrationNumber: true, name: true } }, classroom: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.payment.count(),
    ]);
    return { payments, total };
  }

  async findById(id: string) {
    return prisma.payment.findUnique({ where: { id }, include: { enrollment: { include: { student: true, classroom: true } } } });
  }

  async create(data: { enrollmentId: string; amount: number; validUntil?: Date; method?: string; isExempt?: boolean; exemptReason?: string }) {
    return prisma.payment.create({
      data: {
        enrollmentId: data.enrollmentId,
        amount: data.amount,
        validUntil: data.validUntil,
        method: data.method,
        isExempt: data.isExempt || false,
        exemptReason: data.exemptReason,
        status: "PENDING",
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus, method?: string, validUntil?: Date) {
    return prisma.payment.update({ where: { id }, data: { status, paidAt: status === "PAID" ? new Date() : null, ...(method ? { method } : {}), ...(validUntil ? { validUntil } : {}) } });
  }
}