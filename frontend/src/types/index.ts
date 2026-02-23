export interface Student { id: string; registrationNumber: string; name: string; age: number; address: string; phone: string; photoUrl: string | null; qrCode: string; createdAt: string; enrollments?: Enrollment[]; }
export interface Enrollment { id: string; studentId: string; classroomId: string; status: "ACTIVE" | "CANCELLED"; student?: Pick<Student, "id"|"registrationNumber"|"name"|"photoUrl"|"qrCode">; classroom?: Classroom; payments?: Payment[]; createdAt: string; }
export interface Payment { id: string; enrollmentId: string; status: "PAID" | "PENDING"; amount: number; validUntil: string | null; paidAt: string | null; enrollment?: Enrollment; createdAt: string; }
export interface Classroom { id: string; name: string; maxCapacity: number; _count?: { enrollments: number }; }
export interface AccessResult { name: string; registrationNumber: string; photoUrl: string | null; qrCode: string; status: "AUTHORIZED" | "BLOCKED"; enrollmentStatus?: string; paymentStatus?: string; paymentValidUntil?: string | null; classroom?: string; message: string; attendanceRegistered?: boolean; }
export interface Attendance { id: string; studentId: string; createdAt: string; }
export interface ApiResponse<T> { success: boolean; data?: T; message?: string; error?: string; meta?: { page: number; limit: number; total: number; totalPages: number }; }
// ---- Attendance Types ----
export interface AttendanceSummary {
  id: string;
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  totalAttendances: number;
  lastAttendance: string | null;
}

export interface DailyAttendance {
  date: string;
  count: number;
}

export interface AttendanceStats {
  total: number;
  today: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  createdAt: string;
}
// ---- Feedback Types ----
export interface Feedback {
  id: string;
  studentId: string;
  student?: { id: string; name: string; registrationNumber: string; photoUrl: string | null };
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface FeedbackAverage {
  average: number;
  count: number;
}