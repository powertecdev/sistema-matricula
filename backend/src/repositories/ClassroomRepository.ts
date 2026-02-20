import { prisma } from "../config/prisma";
import { CreateClassroomDTO } from "../types";

export class ClassroomRepository {
  async findAll() {
    return prisma.classroom.findMany({
      include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.classroom.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { select: { id: true, registrationNumber: true, name: true } } },
        },
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    });
  }

  async create(data: CreateClassroomDTO) {
    return prisma.classroom.create({ data });
  }
}
