import { Request, Response } from "express";
import { ClassroomService } from "../services";
import { createClassroomSchema, paginationSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const service = new ClassroomService();

export class ClassroomController {
  async list(req: Request, res: Response) {
    const result = await service.list();
    sendSuccess(res, result);
  }
  async getById(req: Request, res: Response) {
    sendSuccess(res, await service.getById(String(req.params.id)));
  }
  async create(req: Request, res: Response) {
    sendCreated(res, await service.create(createClassroomSchema.parse(req.body) as any), "Turma criada");
  }
}