import { EnrollmentStatus, PaymentStatus } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateStudentDTO {
  registrationNumber: string;
  name: string;
  age: number;
  address: string;
  phone: string;
}

export interface UpdateStudentDTO {
  name?: string;
  age?: number;
  address?: string;
  phone?: string;
}

export interface CreateEnrollmentDTO {
  studentId: string;
  classroomId: string;
}

export interface CreatePaymentDTO {
  enrollmentId: string;
  amount: number;
  dueDate?: string;
}

export type AccessStatus = "AUTHORIZED" | "BLOCKED";

export interface AccessResponse {
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  status: AccessStatus;
  enrollmentStatus?: EnrollmentStatus;
  paymentStatus?: PaymentStatus;
  classroom?: string;
  message: string;
}

export interface CreateClassroomDTO {
  name: string;
  maxCapacity: number;
}
