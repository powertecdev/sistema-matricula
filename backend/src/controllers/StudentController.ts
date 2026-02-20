import { Request, Response } from "express";
import { StudentService } from "../services";
import { createStudentSchema, updateStudentSchema, paginationSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const service = new StudentService();

export class StudentController {
  async list(req: Request, res: Response) {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const result = await service.list(page, limit, search);
    sendSuccess(res, result.students, undefined, 200, result.meta);
  }

  async getById(req: Request, res: Response) {
    sendSuccess(res, await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    const data = createStudentSchema.parse(req.body);
    sendCreated(res, await service.create(data), "Aluno cadastrado com sucesso");
  }

  async update(req: Request, res: Response) {
    const data = updateStudentSchema.parse(req.body);
    sendSuccess(res, await service.update(req.params.id, data), "Aluno atualizado");
  }

  async uploadPhoto(req: Request, res: Response) {
    if (!req.file) return sendSuccess(res, null, "Nenhum arquivo enviado", 400);
    sendSuccess(res, await service.updatePhoto(req.params.id, `/uploads/photos/${req.file.filename}`), "Foto atualizada");
  }

  async uploadDocument(req: Request, res: Response) {
    if (!req.file) return sendSuccess(res, null, "Nenhum arquivo enviado", 400);
    sendCreated(res, await service.uploadDocument(req.params.id, req.file), "Documento enviado");
  }

  async getDocuments(req: Request, res: Response) {
    sendSuccess(res, await service.getDocuments(req.params.id));
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    sendSuccess(res, null, "Aluno removido");
  }
}
