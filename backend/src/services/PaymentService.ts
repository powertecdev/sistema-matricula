import { PaymentRepository } from "../repositories/PaymentRepository";
import { EnrollmentRepository } from "../repositories/EnrollmentRepository";
import { NotFoundError } from "../utils/AppError";
import { PaymentStatus } from "@prisma/client";

export class PaymentService {
  constructor(
    private payRepo = new PaymentRepository(),
    private enrollRepo = new EnrollmentRepository()
  ) {}

  async list(page: number, limit: number) {
    const { payments, total } = await this.payRepo.findAll(page, limit);
    return { payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(data: { enrollmentId: string; amount: number; validUntil?: string; method?: string; isExempt?: boolean; exemptReason?: string }) {
    if (!(await this.enrollRepo.findById(data.enrollmentId))) throw new NotFoundError("Matricula");
    return this.payRepo.create({
      enrollmentId: data.enrollmentId,
      amount: data.amount,
      method: data.method,
      isExempt: data.isExempt,
      exemptReason: data.exemptReason,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });
  }

  async getById(id: string) {
    const p = await this.payRepo.findById(id);
    if (!p) throw new NotFoundError("Pagamento");
    return p;
  }

  async updateStatus(id: string, status: PaymentStatus, method?: string) {
    const p = await this.payRepo.findById(id);
    if (!p) throw new NotFoundError("Pagamento");
    return this.payRepo.updateStatus(id, status, method);
  }
}