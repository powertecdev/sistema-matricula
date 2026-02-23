import { prisma } from "../config/prisma";

export class AttendanceRepository {
  async findByStudentId(studentId: string, page: number, limit: number) {
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.attendance.count({ where: { studentId } }),
    ]);
    return { records, total };
  }

  async findLastByStudent(studentId: string) {
    return prisma.attendance.findFirst({ where: { studentId }, orderBy: { createdAt: "desc" } });
  }

  async create(studentId: string) {
    return prisma.attendance.create({ data: { studentId } });
  }

  async countByStudent(studentId: string) {
    return prisma.attendance.count({ where: { studentId } });
  }

  async countToday() {
    const start = new Date(); start.setHours(0,0,0,0);
    return prisma.attendance.count({ where: { createdAt: { gte: start } } });
  }

  async countTotal() {
    return prisma.attendance.count();
  }

  async getSummary() {
    const students = await prisma.student.findMany({
      include: { _count: { select: { attendances: true } }, attendances: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { name: "asc" },
    });
    return students.map(s => ({
      id: s.id, name: s.name, registrationNumber: s.registrationNumber, photoUrl: s.photoUrl,
      totalAttendances: s._count.attendances,
      lastAttendance: s.attendances[0]?.createdAt || null,
    })).sort((a, b) => b.totalAttendances - a.totalAttendances);
  }

  async getDaily(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days); since.setHours(0,0,0,0);
    const records = await prisma.attendance.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });
    const map: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      map[d.toISOString().split("T")[0]] = 0;
    }
    records.forEach(r => { const k = r.createdAt.toISOString().split("T")[0]; if (map[k] !== undefined) map[k]++; });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }

  async getStats() {
    const [total, today] = await Promise.all([this.countTotal(), this.countToday()]);
    return { total, today };
  }
}