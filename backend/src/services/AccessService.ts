import { StudentRepository } from "../repositories/StudentRepository";
import { AttendanceRepository } from "../repositories/AttendanceRepository";
import { AccessResponse } from "../types";
import { NotFoundError } from "../utils/AppError";

const COOLDOWN_MS = 5 * 60 * 1000;

export class AccessService {
  constructor(
    private studentRepo = new StudentRepository(),
    private attendanceRepo = new AttendanceRepository()
  ) {}

  async checkAccess(qrCode: string): Promise<AccessResponse> {
    // Busca pelo qrCode completo ou pelo shortCode (8 chars)
    let student = await this.studentRepo.findByQrCode(qrCode);
    if (!student && qrCode.length <= 12) {
      const fullQr = await this.studentRepo.findByShortCode(qrCode);
      if (fullQr) student = await this.studentRepo.findByQrCode(fullQr);
    }
    if (!student) throw new NotFoundError("Aluno com este QR Code");

    const base = {
      name: student.name,
      registrationNumber: student.registrationNumber,
      photoUrl: student.photoUrl,
      qrCode: student.qrCode,
    };

    // ===== TRIAL: aluno experimental =====
    if ((student as any).isTrial) {
      const expires = (student as any).trialExpiresAt;
      if (expires && new Date(expires) < new Date()) {
        return {
          ...base, status: "BLOCKED",
          message: "Periodo experimental expirado",
          attendanceRegistered: false,
        };
      }

      // Trial válido  registrar frequência com cooldown
      let registered = false;
      const last = await this.attendanceRepo.findLastByStudent(student.id);
      if (!last || (Date.now() - last.createdAt.getTime()) > COOLDOWN_MS) {
        await this.attendanceRepo.create(student.id);
        registered = true;
      }

      const active = student.enrollments.find((e) => e.status === "ACTIVE");
      return {
        ...base, status: "AUTHORIZED",
        classroom: active?.classroom?.name || "Experimental",
        message: registered ? "Acesso autorizado (experimental)" : "Acesso autorizado (experimental - frequencia ja registrada)",
        attendanceRegistered: registered,
      };
    }

    // ===== FLUXO NORMAL =====
    const active = student.enrollments.find((e) => e.status === "ACTIVE");

    if (!active)
      return { ...base, status: "BLOCKED", message: "Matricula nao esta ativa", attendanceRegistered: false };

    // Busca pagamento valido: isento OU pago e nao vencido
    const exemptPay = active.payments.find((p: any) => p.isExempt);
    const validPaidPay = active.payments.find((p: any) => p.status === "PAID" && (!p.validUntil || new Date(p.validUntil) >= new Date()));
    const pay = exemptPay || validPaidPay;

    if (!pay) {
      // Verifica se tem pagamento pago mas vencido
      const expiredPay = active.payments.find((p: any) => p.status === "PAID" && p.validUntil && new Date(p.validUntil) < new Date());
      if (expiredPay)
        return {
          ...base, status: "BLOCKED",
          enrollmentStatus: active.status,
          paymentStatus: "PAID",
          paymentValidUntil: expiredPay.validUntil,
          classroom: active.classroom.name,
          message: "Pagamento vencido - realize um novo pagamento",
          attendanceRegistered: false,
        };

      return {
        ...base, status: "BLOCKED",
        enrollmentStatus: active.status,
        paymentStatus: active.payments[0]?.status || "PENDING",
        classroom: active.classroom.name,
        message: "Pagamento pendente",
        attendanceRegistered: false,
      };
    }

    let registered = false;
    const last = await this.attendanceRepo.findLastByStudent(student.id);
    if (!last || (Date.now() - last.createdAt.getTime()) > COOLDOWN_MS) {
      await this.attendanceRepo.create(student.id);
      registered = true;
    }

    return {
      ...base, status: "AUTHORIZED",
      enrollmentStatus: active.status,
      paymentStatus: "PAID",
      paymentValidUntil: pay.validUntil,
      classroom: active.classroom.name,
      message: registered ? "Acesso autorizado" : "Acesso autorizado (frequencia ja registrada)",
      attendanceRegistered: registered,
    };
  }
}