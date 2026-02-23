import { FeedbackRepository } from "../repositories/FeedbackRepository";

const repo = new FeedbackRepository();

export class FeedbackService {
  async list(page = 1, limit = 20) {
    return repo.findAll(page, limit);
  }

  async listByStudent(studentId: string) {
    return repo.findByStudent(studentId);
  }

  async create(data: { studentId: string; rating: number; comment: string; author?: string }) {
    if (data.rating < 1 || data.rating > 5) throw new Error("Rating deve ser entre 1 e 5");
    return repo.create(data);
  }

  async delete(id: string) {
    return repo.delete(id);
  }

  async getStudentAverage(studentId: string) {
    return repo.getAverageByStudent(studentId);
  }
}