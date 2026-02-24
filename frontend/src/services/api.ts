import axios from "axios";
import type { Student, Enrollment, Payment, Classroom, AccessResult, Attendance, ApiResponse } from "../types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api" });

export const studentApi = {
  list: (p=1,l=10,s="") => api.get<ApiResponse<Student[]>>(`/students?page=${p}&limit=${l}&search=${s}`),
  getById: (id: string) => api.get<ApiResponse<Student>>(`/students/${id}`),
  create: (d: any) => api.post<ApiResponse<Student>>("/students", d),
  update: (id: string, d: any) => api.put<ApiResponse<Student>>(`/students/${id}`, d),
  delete: (id: string) => api.delete(`/students/${id}`),
  uploadPhoto: (id: string, f: File) => { const fd = new FormData(); fd.append("photo", f); return api.post(`/students/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } }); },
  getQRCode: (id: string) => api.get<ApiResponse<{ qrCode: string; qrCodeImage: string; studentName: string; registrationNumber: string }>>(`/students/${id}/qrcode`),
};

export const enrollmentApi = {
  list: (p=1,l=10) => api.get<ApiResponse<Enrollment[]>>(`/enrollments?page=${p}&limit=${l}`),
  create: (d: { studentId: string; classroomId: string }) => api.post<ApiResponse<Enrollment>>("/enrollments", d),
  updateStatus: (id: string, s: string) => api.patch<ApiResponse<Enrollment>>(`/enrollments/${id}/status`, { status: s }),
};

export const paymentApi = {
  list: (p=1,l=100) => api.get<ApiResponse<Payment[]>>(`/payments?page=${p}&limit=${l}`),
  create: (d: { enrollmentId: string; amount: number; validUntil?: string }) => api.post<ApiResponse<Payment>>("/payments", d),
  updateStatus: (id: string, s: string, method?: string) => api.patch<ApiResponse<Payment>>(`/payments/${id}/status`, { status: s, method }),
};

export const accessApi = {
  check: (qr: string) => api.get<ApiResponse<AccessResult>>(`/access/${qr}`),
};

export const classroomApi = {
  list: () => api.get<ApiResponse<Classroom[]>>("/classrooms"),
  create: (d: { name: string; maxCapacity: number }) => api.post<ApiResponse<Classroom>>("/classrooms", d),
};

export const attendanceApi = {
  listByStudent: (sid: string, p = 1) =>
    api.get<ApiResponse<Attendance[]>>(`/attendance/student/${sid}?page=${p}&limit=20`),

  getByStudent: (studentId: string, page = 1, limit = 20) =>
    api.get(`/attendance/student/${studentId}?page=${page}&limit=${limit}`),

  getCountByStudent: (studentId: string) =>
    api.get(`/attendance/student/${studentId}/count`),

  getSummary: () =>
    api.get("/attendance/summary"),

  getDaily: (days = 30) =>
    api.get(`/attendance/daily?days=${days}`),

  getStats: () =>
    api.get("/attendance/stats"),
};
// ---- Feedback API ----
export const feedbackApi = {
  list: (page = 1, limit = 20) =>
    api.get(`/feedback?page=${page}&limit=${limit}`),

  listByStudent: (studentId: string) =>
    api.get(`/feedback/student/${studentId}`),

  create: (data: { studentId: string; rating: number; comment: string; author?: string }) =>
    api.post("/feedback", data),

  delete: (id: string) =>
    api.delete(`/feedback/${id}`),

  getStudentAverage: (studentId: string) =>
    api.get(`/feedback/student/${studentId}/average`),
};