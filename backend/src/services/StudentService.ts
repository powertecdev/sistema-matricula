import { StudentRepository, DocumentRepository, EnrollmentRepository, PaymentRepository, ClassroomRepository } from "../repositories";
import { CreateStudentDTO, UpdateStudentDTO } from "../types";
import { NotFoundError, ConflictError, ValidationError } from "../utils/AppError";
import { randomUUID } from "crypto";
import { generateBarcodeDataURL } from "../utils/qrcode";
import fs from "fs";

export class StudentService {
  constructor(
    private repo = new StudentRepository(),
    private docRepo = new DocumentRepository(),
    private enrollRepo = new EnrollmentRepository(),
    private payRepo = new PaymentRepository(),
    private classRepo = new ClassroomRepository()
  ) {}

  async list(page: number, limit: number, search?: string) {
    const { students, total } = await this.repo.findAll(page, limit, search);
    return { students, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError("Aluno");
    return s;
  }

  async create(data: CreateStudentDTO & { classroomId?: string; paymentAmount?: number; paymentValidUntil?: string; enrollmentValidUntil?: string; isExempt?: boolean; exemptReason?: string }) {
    if (await this.repo.existsByRegistrationNumber(data.registrationNumber))
      throw new ConflictError("Matricula ja existe");

    if (data.classroomId) {
      const classroom = await this.classRepo.findById(data.classroomId);
      if (!classroom) throw new NotFoundError("Turma");
      const count = await this.enrollRepo.countActiveByClassroom(data.classroomId);
      if (count >= classroom.maxCapacity)
        throw new ValidationError("Turma lotada (" + classroom.maxCapacity + " vagas)");
    }

    const qrCode = randomUUID();
    const student = await this.repo.create({
      registrationNumber: data.registrationNumber,
      name: data.name,
      age: data.age,
      address: data.address,
      phone: data.phone,
      qrCode,
    });

    if (data.classroomId) {
      const enrollment = await this.enrollRepo.create({
        studentId: student.id,
        classroomId: data.classroomId,
        validUntil: data.enrollmentValidUntil ? new Date(data.enrollmentValidUntil) : undefined,
      } as any);
      const payData: any = {
        enrollmentId: enrollment.id,
        amount: data.isExempt ? 0 : (data.paymentAmount || 0),
        validUntil: data.paymentValidUntil ? new Date(data.paymentValidUntil) : undefined,
        isExempt: data.isExempt || false,
        exemptReason: data.exemptReason,
      };
      const payment = await this.payRepo.create(payData);
      if (data.isExempt) {
        await this.payRepo.updateStatus(payment.id, "PAID");
      }
    }

    return this.repo.findById(student.id);
  }

  async update(id: string, data: UpdateStudentDTO) { await this.getById(id); return this.repo.update(id, data); }

  async updatePhoto(id: string, photoUrl: string) {
    const s = await this.getById(id);
    if (s.photoUrl) { const old = s.photoUrl.startsWith("/") ? "." + s.photoUrl : s.photoUrl; if (fs.existsSync(old)) fs.unlinkSync(old); }
    return this.repo.update(id, { photoUrl });
  }

  async updateFaceDescriptor(id: string, descriptor: string) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError("Aluno");
    return this.repo.updateFaceDescriptor(id, descriptor);
  }

  async getAllFaceDescriptors() {
    return this.repo.findAllWithFace();
  }

  async getQRCode(id: string) {
    const s = await this.getById(id);
    const dataUrl = await generateBarcodeDataURL(s.qrCode);
    return { qrCode: s.qrCode, qrCodeImage: dataUrl, studentName: s.name, registrationNumber: s.registrationNumber };
  }

  async uploadDocument(studentId: string, file: Express.Multer.File) {
    await this.getById(studentId);
    return this.docRepo.create({ studentId, fileName: file.originalname, fileUrl: "/uploads/documents/" + file.filename, fileType: file.mimetype, fileSize: file.size });
  }

  async getDocuments(studentId: string) { await this.getById(studentId); return this.docRepo.findByStudentId(studentId); }
  async delete(id: string) { await this.getById(id); return this.repo.delete(id); }
}