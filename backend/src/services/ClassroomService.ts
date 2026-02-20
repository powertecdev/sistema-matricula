import { ClassroomRepository } from "../repositories";
import { CreateClassroomDTO } from "../types";
import { NotFoundError } from "../utils/AppError";

export class ClassroomService {
  constructor(private classroomRepo = new ClassroomRepository()) {}

  async list() { return this.classroomRepo.findAll(); }

  async getById(id: string) {
    const classroom = await this.classroomRepo.findById(id);
    if (!classroom) throw new NotFoundError("Turma");
    return classroom;
  }

  async create(data: CreateClassroomDTO) { return this.classroomRepo.create(data); }
}
