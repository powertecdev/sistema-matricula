import { prisma } from "../config/prisma";
import { CreateStudentDTO, UpdateStudentDTO } from "../types";
import { Prisma } from "@prisma/client";

export class StudentRepository {
  async findAll(page: number, limit: number, search?: string) {
    const where: Prisma.StudentWhereInput = search
      ? { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { registrationNumber: { contains: search, mode: "insensitive" } },
        ]}
      : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: {
              classroom: { select: { id: true, name: true } },
              payments: { select: { id: true, status: true, amount: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);
    return { students, total };
  }

  async findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        documents: true,
        enrollments: {
          include: {
            classroom: { select: { id: true, name: true } },
            payments: true,
          },
        },
      },
    });
  }

  async findByRegistrationNumber(registrationNumber: string) {
    return prisma.student.findUnique({
      where: { registrationNumber },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            classroom: { select: { id: true, name: true } },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });
  }

  async create(data: CreateStudentDTO) {
    return prisma.student.create({ data });
  }

  async update(id: string, data: UpdateStudentDTO & { photoUrl?: string }) {
    return prisma.student.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.student.delete({ where: { id } });
  }

  async existsByRegistrationNumber(registrationNumber: string) {
    return (await prisma.student.count({ where: { registrationNumber } })) > 0;
  }
}
