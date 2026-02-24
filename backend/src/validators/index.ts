import { z } from "zod";
export const createStudentSchema = z.object({
  registrationNumber: z.string().min(1).max(20).regex(/^[A-Za-z0-9-]+$/),
  name: z.string().min(3).max(100),
  age: z.number({ coerce: true }).int().min(1).max(120),
  address: z.string().min(5).max(200),
  phone: z.string().min(8).max(20),
  classroomId: z.string().uuid().optional(),
  paymentAmount: z.number({ coerce: true }).min(0).optional(),
  paymentValidUntil: z.string().optional(),
  enrollmentValidUntil: z.string().optional(),
  isExempt: z.boolean().optional(),
  exemptReason: z.string().optional(),
});
export const updateStudentSchema = z.object({ name: z.string().min(3).max(100).optional(), age: z.number({ coerce: true }).int().min(1).max(120).optional(), address: z.string().min(5).max(200).optional(), phone: z.string().min(8).max(20).optional() });
export const createEnrollmentSchema = z.object({ studentId: z.string().uuid(), classroomId: z.string().uuid(), validUntil: z.string().optional() });
export const updateEnrollmentSchema = z.object({ status: z.enum(["ACTIVE", "CANCELLED"]) });
export const createPaymentSchema = z.object({ enrollmentId: z.string().uuid(), amount: z.number({ coerce: true }).min(0), validUntil: z.string().optional(), method: z.string().optional(), isExempt: z.boolean().optional(), exemptReason: z.string().optional() });
export const updatePaymentSchema = z.object({ status: z.enum(["PAID", "PENDING"]), method: z.string().optional() });
export const createClassroomSchema = z.object({ name: z.string().min(2).max(50), maxCapacity: z.number({ coerce: true }).int().min(1).max(100) });
export const paginationSchema = z.object({ page: z.number({ coerce: true }).int().min(1).default(1), limit: z.number({ coerce: true }).int().min(1).max(500).default(10), search: z.string().optional() });