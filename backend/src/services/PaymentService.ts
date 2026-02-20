import { PaymentRepository, EnrollmentRepository } from "../repositories";
import { NotFoundError } from "../utils/AppError";
import { PaymentStatus } from "@prisma/client";

export class PaymentService {
  constructor(
    private paymentRepo = new PaymentRepository(),
    private enrollmentRepo = new EnrollmentRepository()
  ) {}

  async list(page: number, limit: number) {
    const { payments, total } = await this.paymentRepo.findAll(page, limit);
    return { payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundError("Pagamento");
    return payment;
  }

  async create(data: { enrollmentId: string; amount: number; dueDate?: string }) {
    const enrollment = await this.enrollmentRepo.findById(data.enrollmentId);
    if (!enrollment) throw new NotFoundError("Matrícula");
    return this.paymentRepo.create({
      enrollmentId: data.enrollmentId,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  }

  async updateStatus(id: string, status: PaymentStatus) {
    await this.getById(id);
    return this.paymentRepo.updateStatus(id, status);
  }
}
