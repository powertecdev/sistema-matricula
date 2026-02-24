import { Request, Response } from "express";
import { EnrollmentService } from "../services";
import { createEnrollmentSchema, updateEnrollmentSchema, paginationSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const service = new EnrollmentService();

export class EnrollmentController {
  async list(req: Request, res: Response) {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await service.list(page, limit);
    sendSuccess(res, result.enrollments, undefined, 200, result.meta);
  }
  async getById(req: Request, res: Response) {
    sendSuccess(res, await service.getById(String(req.params.id)));
  }
  async create(req: Request, res: Response) {
    sendCreated(res, await service.create(createEnrollmentSchema.parse(req.body) as any), "Matrícula criada");
  }
  async updateStatus(req: Request, res: Response) {
    const { status } = updateEnrollmentSchema.parse(req.body);
    sendSuccess(res, await service.updateStatus(String(req.params.id), status), "Status atualizado");
  }
}