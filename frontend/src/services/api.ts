import axios from "axios";
import type { Student, Enrollment, Payment, Classroom, DocumentFile, AccessResult, ApiResponse } from "../types";

const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } });

export const studentApi = {
  list: (page = 1, limit = 10, search = "") =>
    api.get<ApiResponse<Student[]>>(`/students?page=${page}&limit=${limit}&search=${search}`),
  getById: (id: string) => api.get<ApiResponse<Student>>(`/students/${id}`),
  create: (data: any) => api.post<ApiResponse<Student>>("/students", data),
  update: (id: string, data: any) => api.put<ApiResponse<Student>>(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData(); fd.append("photo", file);
    return api.post<ApiResponse<Student>>(`/students/${id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  uploadDocument: (id: string, file: File) => {
    const fd = new FormData(); fd.append("document", file);
    return api.post<ApiResponse<DocumentFile>>(`/students/${id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  getDocuments: (id: string) => api.get<ApiResponse<DocumentFile[]>>(`/students/${id}/documents`),
};

export const enrollmentApi = {
  list: (page = 1, limit = 10) => api.get<ApiResponse<Enrollment[]>>(`/enrollments?page=${page}&limit=${limit}`),
  create: (data: { studentId: string; classroomId: string }) => api.post<ApiResponse<Enrollment>>("/enrollments", data),
  updateStatus: (id: string, status: string) => api.patch<ApiResponse<Enrollment>>(`/enrollments/${id}/status`, { status }),
};

export const paymentApi = {
  list: (page = 1, limit = 100) => api.get<ApiResponse<Payment[]>>(`/payments?page=${page}&limit=${limit}`),
  create: (data: { enrollmentId: string; amount: number }) => api.post<ApiResponse<Payment>>("/payments", data),
  updateStatus: (id: string, status: string) => api.patch<ApiResponse<Payment>>(`/payments/${id}/status`, { status }),
};

export const accessApi = {
  check: (reg: string) => api.get<ApiResponse<AccessResult>>(`/access/${reg}`),
};

export const classroomApi = {
  list: () => api.get<ApiResponse<Classroom[]>>("/classrooms"),
  create: (data: { name: string; maxCapacity: number }) => api.post<ApiResponse<Classroom>>("/classrooms", data),
};
