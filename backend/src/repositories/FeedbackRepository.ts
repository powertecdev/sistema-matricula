import { prisma } from "../config/prisma";

export class FeedbackRepository {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.feedback.findMany({
        include: {
          student: { select: { id: true, name: true, registrationNumber: true, photoUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count(),
    ]);
    return { data, total, page, limit };
  }

  async findByStudent(studentId: string) {
    return prisma.feedback.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: { studentId: string; rating: number; comment: string; author?: string }) {
    return prisma.feedback.create({ data });
  }

  async delete(id: string) {
    return prisma.feedback.delete({ where: { id } });
  }

  async getAverageByStudent(studentId: string) {
    const result = await prisma.feedback.aggregate({
      where: { studentId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return { average: result._avg.rating || 0, count: result._count.rating };
  }
}