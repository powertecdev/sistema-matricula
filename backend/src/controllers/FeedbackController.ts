import { Request, Response } from "express";
import { FeedbackService } from "../services/FeedbackService";
import { sendSuccess } from "../utils/response";

const service = new FeedbackService();

export class FeedbackController {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await service.list(page, limit);
    sendSuccess(res, result.data, { total: result.total, page: result.page, limit: result.limit });
  }

  async listByStudent(req: Request, res: Response) {
    const data = await service.listByStudent(req.params.studentId);
    sendSuccess(res, data);
  }

  async create(req: Request, res: Response) {
    const { studentId, rating, comment, author } = req.body;
    const feedback = await service.create({ studentId, rating: Number(rating), comment: comment || "", author });
    sendSuccess(res, feedback, undefined, 201);
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    sendSuccess(res, { deleted: true });
  }

  async getStudentAverage(req: Request, res: Response) {
    const data = await service.getStudentAverage(req.params.studentId);
    sendSuccess(res, data);
  }
}