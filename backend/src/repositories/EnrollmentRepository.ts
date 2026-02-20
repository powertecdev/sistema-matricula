import { prisma } from "../config/prisma";
import { CreateEnrollmentDTO } from "../types";
import { EnrollmentStatus } from "@prisma/client";

export class EnrollmentRepository {
  async findAll(page: number, limit: number) {
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        include: {
          student: { select: { id: true, registrationNumber: true, name: true, photoUrl: true } },
          classroom: { select: { id: true, name: true } },
          payments: { select: { id: true, status: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count(),
    ]);
    return { enrollments, total };
  }

  async findById(id: string) {
    return prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, classroom: true, payments: true },
    });
  }

  async create(data: CreateEnrollmentDTO) {
    return prisma.enrollment.create({
      data,
      include: {
        student: { select: { id: true, registrationNumber: true, name: true } },
        classroom: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: EnrollmentStatus) {
    return prisma.enrollment.update({ where: { id }, data: { status } });
  }

  async countActiveByClassroom(classroomId: string) {
    return prisma.enrollment.count({ where: { classroomId, status: "ACTIVE" } });
  }

  async existsActiveForStudent(studentId: string, classroomId: string) {
    return (await prisma.enrollment.count({ where: { studentId, classroomId, status: "ACTIVE" } })) > 0;
  }
}
