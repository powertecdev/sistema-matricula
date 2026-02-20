import { z } from "zod";

export const createStudentSchema = z.object({
  registrationNumber: z.string().min(1, "Matrícula obrigatória").max(20).regex(/^[A-Za-z0-9-]+$/, "Apenas letras, números e hífens"),
  name: z.string().min(3, "Mínimo 3 caracteres").max(100),
  age: z.number({ coerce: true }).int().min(1).max(120),
  address: z.string().min(5).max(200),
  phone: z.string().min(8).max(20),
});

export const updateStudentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  age: z.number({ coerce: true }).int().min(1).max(120).optional(),
  address: z.string().min(5).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid("ID do aluno inválido"),
  classroomId: z.string().uuid("ID da turma inválido"),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED"]),
});

export const createPaymentSchema = z.object({
  enrollmentId: z.string().uuid("ID da matrícula inválido"),
  amount: z.number({ coerce: true }).positive("Valor deve ser positivo"),
  dueDate: z.string().datetime().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PAID", "PENDING"]),
});

export const createClassroomSchema = z.object({
  name: z.string().min(2).max(50),
  maxCapacity: z.number({ coerce: true }).int().min(1).max(100),
});

export const accessParamSchema = z.object({
  registrationNumber: z.string().min(1, "Matrícula obrigatória"),
});

export const paginationSchema = z.object({
  page: z.number({ coerce: true }).int().min(1).default(1),
  limit: z.number({ coerce: true }).int().min(1).max(100).default(10),
  search: z.string().optional(),
});
