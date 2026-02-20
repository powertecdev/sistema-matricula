export interface Student {
  id: string;
  registrationNumber: string;
  name: string;
  age: number;
  address: string;
  phone: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  enrollments?: Enrollment[];
  documents?: DocumentFile[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  status: "ACTIVE" | "CANCELLED";
  student?: Pick<Student, "id" | "registrationNumber" | "name" | "photoUrl">;
  classroom?: Classroom;
  payments?: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  enrollmentId: string;
  status: "PAID" | "PENDING";
  amount: number;
  enrollment?: Enrollment;
  createdAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  maxCapacity: number;
  _count?: { enrollments: number };
}

export interface DocumentFile {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface AccessResult {
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  status: "AUTHORIZED" | "BLOCKED";
  enrollmentStatus?: string;
  paymentStatus?: string;
  classroom?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
