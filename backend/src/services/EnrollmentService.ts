import { EnrollmentRepository, ClassroomRepository, StudentRepository } from "../repositories";
import { CreateEnrollmentDTO } from "../types";
import { NotFoundError, ConflictError, ValidationError } from "../utils/AppError";
import { EnrollmentStatus } from "@prisma/client";

export class EnrollmentService {
  constructor(
    private enrollmentRepo = new EnrollmentRepository(),
    private classroomRepo = new ClassroomRepository(),
    private studentRepo = new StudentRepository()
  ) {}

  async list(page: number, limit: number) {
    const { enrollments, total } = await this.enrollmentRepo.findAll(page, limit);
    return { enrollments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const enrollment = await this.enrollmentRepo.findById(id);
    if (!enrollment) throw new NotFoundError("Matrícula");
    return enrollment;
  }

  async create(data: CreateEnrollmentDTO) {
    const student = await this.studentRepo.findById(data.studentId);
    if (!student) throw new NotFoundError("Aluno");

    const classroom = await this.classroomRepo.findById(data.classroomId);
    if (!classroom) throw new NotFoundError("Turma");

    if (await this.enrollmentRepo.existsActiveForStudent(data.studentId, data.classroomId)) {
      throw new ConflictError("Aluno já possui matrícula ativa nesta turma");
    }

    const activeCount = await this.enrollmentRepo.countActiveByClassroom(data.classroomId);
    if (activeCount >= classroom.maxCapacity) {
      throw new ValidationError(`Turma "${classroom.name}" atingiu o limite de ${classroom.maxCapacity} vagas`);
    }

    return this.enrollmentRepo.create(data);
  }

  async updateStatus(id: string, status: EnrollmentStatus) {
    await this.getById(id);
    return this.enrollmentRepo.updateStatus(id, status);
  }
}
