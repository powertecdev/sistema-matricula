import { Request, Response } from "express";
import { ClassroomService } from "../services";
import { createClassroomSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";
import { z } from "zod";

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
  async update(req: Request, res: Response) {
    const { name } = z.object({ name: z.string().min(2).max(50) }).parse(req.body);
    sendSuccess(res, await service.update(String(req.params.id), name));
  }
}