import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { enrollmentApi, studentApi, classroomApi } from "../services/api";
import type { Enrollment, Student, Classroom } from "../types";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ studentId: "", classroomId: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, sRes, cRes] = await Promise.all([
        enrollmentApi.list(1, 50),
        studentApi.list(1, 100),
        classroomApi.list(),
      ]);
      setEnrollments(eRes.data.data || []);
      setStudents(sRes.data.data || []);
      setClassrooms(cRes.data.data || []);
    } catch {
      toast.error("Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enrollmentApi.create(form);
      toast.success("Matrícula criada!");
      setShowCreate(false);
      setForm({ studentId: "", classroomId: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await enrollmentApi.updateStatus(id, status);
      toast.success("Status atualizado!");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">
            Matrículas
          </h1>
          <p className="text-sm text-slate-500">Gerenciar vínculos aluno-turma</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Matrícula</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhuma matrícula encontrada</p>
        </div>
      ) : (
        <>
          {/* Tabela Desktop */}
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {["Aluno", "Turma", "Status", "Pagamento", "Ações"].map((h) => (
                      <th
                        key={h}
                        className={`py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider ${
                          h === "Ações" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const latestPayment = enrollment.payments?.[0];
                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {enrollment.student?.photoUrl ? (
                              <img
                                src={enrollment.student.photoUrl}
                                className="w-8 h-8 rounded-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                                <span className="text-violet-400 font-bold text-xs">
                                  {enrollment.student?.name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {enrollment.student?.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {enrollment.student?.registrationNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-300">
                          {enrollment.classroom?.name}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={
                              enrollment.status === "ACTIVE"
                                ? "badge-active"
                                : "badge-cancelled"
                            }
                          >
                            {enrollment.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={
                              latestPayment?.status === "PAID"
                                ? "badge-paid"
                                : "badge-pending"
                            }
                          >
                            {latestPayment?.status === "PAID" ? "Pago" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {enrollment.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleStatus(enrollment.id, "CANCELLED")}
                              className="btn-danger text-xs px-3 py-1.5"
                            >
                              Cancelar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatus(enrollment.id, "ACTIVE")}
                              className="btn-success text-xs px-3 py-1.5"
                            >
                              Reativar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {enrollments.map((enrollment) => {
              const latestPayment = enrollment.payments?.[0];
              return (
                <div key={enrollment.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {enrollment.student?.photoUrl ? (
                      <img
                        src={enrollment.student.photoUrl}
                        className="w-10 h-10 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 font-bold text-sm">
                          {enrollment.student?.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {enrollment.student?.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {enrollment.student?.registrationNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Turma:</span>
                    <span className="text-slate-300">{enrollment.classroom?.name}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={
                          enrollment.status === "ACTIVE"
                            ? "badge-active"
                            : "badge-cancelled"
                        }
                      >
                        {enrollment.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                      </span>
                      <span
                        className={
                          latestPayment?.status === "PAID"
                            ? "badge-paid"
                            : "badge-pending"
                        }
                      >
                        {latestPayment?.status === "PAID" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                    {enrollment.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleStatus(enrollment.id, "CANCELLED")}
                        className="btn-danger text-xs px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatus(enrollment.id, "ACTIVE")}
                        className="btn-success text-xs px-3 py-1.5"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Nova Matrícula */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova Matrícula">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Aluno</label>
            <select
              className="input-field"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.registrationNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Turma</label>
            <select
              className="input-field"
              value={form.classroomId}
              onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c._count?.enrollments || 0}/{c.maxCapacity})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Matricular
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}