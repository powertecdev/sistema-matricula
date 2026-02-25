import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
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
    sendSuccess(res, await service.getById(String(req.params.id)));
  }
  async create(req: Request, res: Response) {
    sendCreated(res, await service.create(createPaymentSchema.parse(req.body) as any), "Pagamento criado");
  }
  async updateStatus(req: Request, res: Response) {
    console.log("=== UPDATE PAYMENT ===", req.body);
    const { status, method, validUntil } = updatePaymentSchema.parse(req.body);
    console.log("PARSED:", { status, method, validUntil });
    sendSuccess(res, await service.updateStatus(String(req.params.id), status, method, validUntil), "Pagamento atualizado");
  }
}