import { useEffect, useState } from "react";
import { feedbackApi, studentApi } from "../services/api";
import type { Feedback } from "../types";
import Modal from "../components/Modal";
import { MessageSquare, Plus, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ studentId: "", rating: 5, comment: "", author: "Admin" });

  const load = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        feedbackApi.list(1, 100),
        studentApi.list(1, 100),
      ]);
      setFeedbacks(fRes.data.data || []);
      setStudents(sRes.data.data || []);
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
      await feedbackApi.create(form);
      toast.success("Feedback registrado!");
      setShowCreate(false);
      setForm({ studentId: "", rating: 5, comment: "", author: "Admin" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este feedback?")) return;
    try {
      await feedbackApi.delete(id);
      toast.success("Removido!");
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`}
      />
    ));
  };

  const renderStarPicker = () => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setForm({ ...form, rating: i + 1 })}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 ${i < form.rating ? "text-amber-400 fill-amber-400" : "text-slate-600 hover:text-slate-400"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">Feedback</h1>
          <p className="text-sm text-slate-500">Avaliações e observações dos alunos</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Novo Feedback</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum feedback registrado</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="glass-card p-4 sm:p-5 space-y-3">
              {/* Aluno */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {f.student?.photoUrl ? (
                    <img src={f.student.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-bold text-sm">{f.student?.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{f.student?.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{f.student?.registrationNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-1.5 rounded-lg hover:bg-red-600/20 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-400" />
                </button>
              </div>

              {/* Estrelas */}
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(f.rating)}</div>
                <span className="text-xs text-slate-500">{f.rating}/5</span>
              </div>

              {/* Comentário */}
              {f.comment && (
                <p className="text-sm text-slate-300 leading-relaxed">{f.comment}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                <span className="text-xs text-slate-500">por {f.author}</span>
                <span className="text-xs text-slate-600">
                  {new Date(f.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Feedback */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo Feedback">
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
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Avaliação</label>
            {renderStarPicker()}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Comentário</label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="Observações sobre o aluno..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Autor</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nome do professor/admin"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary w-full sm:w-auto">
              Cancelar
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}