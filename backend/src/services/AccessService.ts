import { StudentRepository } from "../repositories";
import { AccessResponse } from "../types";
import { NotFoundError } from "../utils/AppError";

export class AccessService {
  constructor(private studentRepo = new StudentRepository()) {}

  async checkAccess(registrationNumber: string): Promise<AccessResponse> {
    const student = await this.studentRepo.findByRegistrationNumber(registrationNumber);
    if (!student) throw new NotFoundError("Aluno com esta matrícula");

    const activeEnrollment = student.enrollments.find((e) => e.status === "ACTIVE");

    if (!activeEnrollment) {
      return {
        name: student.name,
        registrationNumber: student.registrationNumber,
        photoUrl: student.photoUrl,
        status: "BLOCKED",
        message: "Matrícula não está ativa",
      };
    }

    const latestPayment = activeEnrollment.payments[0];
    const isPaid = latestPayment?.status === "PAID";

    return {
      name: student.name,
      registrationNumber: student.registrationNumber,
      photoUrl: student.photoUrl,
      status: isPaid ? "AUTHORIZED" : "BLOCKED",
      enrollmentStatus: activeEnrollment.status,
      paymentStatus: latestPayment?.status || "PENDING",
      classroom: activeEnrollment.classroom.name,
      message: isPaid ? "Acesso autorizado" : "Pagamento pendente - acesso bloqueado",
    };
  }
}
