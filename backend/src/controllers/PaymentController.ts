import { Request, Response } from "express";
import { PaymentService } from "../services";
import { createPaymentSchema, updatePaymentSchema, paginationSchema } from "../validators";
import { sendSuccess, sendCreated } from "../utils/response";

const service = new PaymentService();

export class PaymentController {
  async list(req: Request, res: Response) {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await service.list(page, limit);
    sendSuccess(res, result.payments, undefined, 200, result.meta);
  }

  async getById(req: Request, res: Response) {
    sendSuccess(res, await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    sendCreated(res, await service.create(createPaymentSchema.parse(req.body)), "Pagamento criado");
  }

  async updateStatus(req: Request, res: Response) {
    const { status, method } = updatePaymentSchema.parse(req.body);
    sendSuccess(res, await service.updateStatus(req.params.id, status, method), "Pagamento atualizado");
  }
}
