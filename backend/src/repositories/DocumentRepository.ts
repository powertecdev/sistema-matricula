import { prisma } from "../config/prisma";

export class DocumentRepository {
  async findByStudentId(studentId: string) {
    return prisma.document.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
  }

  async create(data: { studentId: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }) {
    return prisma.document.create({ data });
  }

  async delete(id: string) {
    return prisma.document.delete({ where: { id } });
  }
}
