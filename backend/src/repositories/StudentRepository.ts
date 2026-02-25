import { prisma } from "../config/prisma";
import { CreateStudentDTO, UpdateStudentDTO } from "../types";
import { Prisma } from "@prisma/client";

export class StudentRepository {
  async findAll(page: number, limit: number, search?: string) {
    const where: Prisma.StudentWhereInput = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { registrationNumber: { contains: search, mode: "insensitive" } }] }
      : {};
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { enrollments: { include: { classroom: { select: { id: true, name: true } }, payments: { select: { id: true, status: true, amount: true, paidAt: true, validUntil: true } } } } },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.student.count({ where }),
    ]);
    return { students, total };
  }

  async findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
      include: { enrollments: { include: { classroom: { select: { id: true, name: true } }, payments: true } } },
    });
  }

  async findByQrCode(qrCode: string) {
    return prisma.student.findUnique({
      where: { qrCode },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { classroom: { select: { id: true, name: true } }, payments: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, amount: true, method: true, isExempt: true, exemptReason: true, validUntil: true, paidAt: true } } },
        },
      },
    });
  }

  async findByShortCode(shortCode: string): Promise<string | null> {
    const students = await prisma.student.findMany({ select: { qrCode: true } });
    const found = students.find(s => {
      const short = s.qrCode.replace(/-/g, "").substring(0, 8).toUpperCase();
      return short === shortCode.toUpperCase();
    });
    return found?.qrCode || null;
  }

  async findByRegistrationNumber(reg: string) {
    return prisma.student.findUnique({ where: { registrationNumber: reg } });
  }

  async create(data: any) {
    return prisma.student.create({ data });
  }

  async update(id: string, data: any) {
    return prisma.student.update({ where: { id }, data });
  }

  async delete(id: string) { return prisma.student.delete({ where: { id } }); }

  async existsByRegistrationNumber(reg: string) {
    return (await prisma.student.count({ where: { registrationNumber: reg } })) > 0;
  }
}