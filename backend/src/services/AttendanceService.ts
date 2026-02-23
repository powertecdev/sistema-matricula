import { AttendanceRepository } from "../repositories/AttendanceRepository";
const repo = new AttendanceRepository();
export class AttendanceService {
  async getByStudent(studentId: string, page = 1, limit = 20) {
    return repo.findByStudentId(studentId, page, limit);
  }
  async getCountByStudent(studentId: string) {
    return repo.countByStudent(studentId);
  }
  async getSummary() {
    return repo.getSummary();
  }
  async getDailyStats(days = 30) {
    return repo.getDaily(days);
  }
  async getGeneralStats() {
    return repo.getStats();
  }
}