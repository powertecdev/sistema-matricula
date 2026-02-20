import { Request, Response } from "express";
import { ClassroomService } from "../services";
import { createClassroomSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const service = new ClassroomService();

export class ClassroomController {
  async list(_req: Request, res: Response) {
    sendSuccess(res, await service.list());
  }

  async getById(req: Request, res: Response) {
    sendSuccess(res, await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    sendCreated(res, await service.create(createClassroomSchema.parse(req.body)), "Turma criada");
  }
}
