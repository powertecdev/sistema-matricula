import { StudentRepository, DocumentRepository } from "../repositories";
import { CreateStudentDTO, UpdateStudentDTO } from "../types";
import { NotFoundError, ConflictError } from "../utils/AppError";
import fs from "fs";

export class StudentService {
  constructor(
    private studentRepo = new StudentRepository(),
    private documentRepo = new DocumentRepository()
  ) {}

  async list(page: number, limit: number, search?: string) {
    const { students, total } = await this.studentRepo.findAll(page, limit, search);
    return { students, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const student = await this.studentRepo.findById(id);
    if (!student) throw new NotFoundError("Aluno");
    return student;
  }

  async create(data: CreateStudentDTO) {
    if (await this.studentRepo.existsByRegistrationNumber(data.registrationNumber)) {
      throw new ConflictError(`Matrícula "${data.registrationNumber}" já existe`);
    }
    return this.studentRepo.create(data);
  }

  async update(id: string, data: UpdateStudentDTO) {
    await this.getById(id);
    return this.studentRepo.update(id, data);
  }

  async updatePhoto(id: string, photoUrl: string) {
    const student = await this.getById(id);
    if (student.photoUrl) {
      const oldPath = student.photoUrl.startsWith("/") ? `.${student.photoUrl}` : student.photoUrl;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    return this.studentRepo.update(id, { photoUrl });
  }

  async uploadDocument(studentId: string, file: Express.Multer.File) {
    await this.getById(studentId);
    return this.documentRepo.create({
      studentId,
      fileName: file.originalname,
      fileUrl: `/uploads/documents/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
    });
  }

  async getDocuments(studentId: string) {
    await this.getById(studentId);
    return this.documentRepo.findByStudentId(studentId);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.studentRepo.delete(id);
  }
}
