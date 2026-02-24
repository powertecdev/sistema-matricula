import { Request, Response } from "express";
import { StudentService } from "../services";
import { createStudentSchema, updateStudentSchema, paginationSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const svc = new StudentService();

export class StudentController {
  async list(req: Request, res: Response) {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const result = await svc.list(page, limit, search);
    sendSuccess(res, result.students, undefined, 200, result.meta);
  }
  async getById(req: Request, res: Response) { sendSuccess(res, await svc.getById(String(req.params.id))); }
  async create(req: Request, res: Response) { sendCreated(res, await svc.create(createStudentSchema.parse(req.body) as any), "Aluno cadastrado"); }
  async update(req: Request, res: Response) { sendSuccess(res, await svc.update(String(req.params.id), updateStudentSchema.parse(req.body) as any), "Atualizado"); }
  async uploadPhoto(req: Request, res: Response) {
    if (!req.file) return sendSuccess(res, null, "Nenhum arquivo", 400);
    sendSuccess(res, await svc.updatePhoto(String(req.params.id), "/uploads/" + req.file.filename), "Foto atualizada");
  }
  async getQRCode(req: Request, res: Response) { sendSuccess(res, await svc.getQRCode(String(req.params.id))); }
  async delete(req: Request, res: Response) { await svc.delete(String(req.params.id)); sendSuccess(res, null, "Removido"); }
}