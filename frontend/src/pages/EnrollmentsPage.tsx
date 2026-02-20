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
      const [eRes, sRes, cRes] = await Promise.all([enrollmentApi.list(1, 50), studentApi.list(1, 100), classroomApi.list()]);
      setEnrollments(eRes.data.data || []);
      setStudents(sRes.data.data || []);
      setClassrooms(cRes.data.data || []);
    } catch { toast.error("Erro ao carregar"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enrollmentApi.create(form);
      toast.success("Matrícula criada!");
      setShowCreate(false);
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await enrollmentApi.updateStatus(id, status);
      toast.success("Status atualizado!");
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Matrículas</h1>
          <p className="text-slate-500">Gerenciar vínculos aluno-turma</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Matrícula</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : enrollments.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhuma matrícula encontrada</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800/60">
              {["Aluno", "Turma", "Status", "Pagamento", "Ações"].map(h => (
                <th key={h} className={`py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {enrollments.map((e) => {
                const latestPayment = e.payments?.[0];
                return (
                  <tr key={e.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {e.student?.photoUrl ? (
                          <img src={e.student.photoUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center">
                            <span className="text-brand-400 font-bold text-xs">{e.student?.name?.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{e.student?.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{e.student?.registrationNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300">{e.classroom?.name}</td>
                    <td className="py-4 px-6"><span className={e.status === "ACTIVE" ? "badge-active" : "badge-cancelled"}>{e.status === "ACTIVE" ? "Ativa" : "Cancelada"}</span></td>
                    <td className="py-4 px-6"><span className={latestPayment?.status === "PAID" ? "badge-paid" : "badge-pending"}>{latestPayment?.status === "PAID" ? "Pago" : "Pendente"}</span></td>
                    <td className="py-4 px-6 text-right">
                      {e.status === "ACTIVE" ? (
                        <button onClick={() => handleStatus(e.id, "CANCELLED")} className="btn-danger text-xs px-3 py-1.5">Cancelar</button>
                      ) : (
                        <button onClick={() => handleStatus(e.id, "ACTIVE")} className="btn-success text-xs px-3 py-1.5">Reativar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova Matrícula">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Aluno</label>
            <select className="input-field" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Selecione...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Turma</label>
            <select className="input-field" value={form.classroomId} onChange={(e) => setForm({ ...form, classroomId: e.target.value })} required>
              <option value="">Selecione...</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c._count?.enrollments || 0}/{c.maxCapacity})</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Matricular</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
