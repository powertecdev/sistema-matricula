import { useEffect, useState } from "react";
import { School, Plus } from "lucide-react";
import { classroomApi } from "../services/api";
import type { Classroom } from "../types";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", maxCapacity: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await classroomApi.list();
      setClassrooms(res.data.data || []);
    } catch { toast.error("Erro"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classroomApi.create({ name: form.name, maxCapacity: Number(form.maxCapacity) });
      toast.success("Turma criada!");
      setShowCreate(false);
      setForm({ name: "", maxCapacity: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Turmas</h1>
          <p className="text-slate-500">Gerenciar turmas e capacidade</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Turma</button>
      </div>

      {classrooms.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <School className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhuma turma cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c) => {
            const count = c._count?.enrollments || 0;
            const pct = Math.round((count / c.maxCapacity) * 100);
            return (
              <div key={c.id} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center"><School className="w-5 h-5 text-cyan-400" /></div>
                  <h3 className="font-display font-semibold text-white">{c.name}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Alunos</span><span className="text-white font-medium">{count} / {c.maxCapacity}</span></div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">{c.maxCapacity - count} vaga(s) disponível(is)</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nova Turma">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm text-slate-400 mb-1.5">Nome da Turma</label><input className="input-field" placeholder="Turma D - Integral" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-sm text-slate-400 mb-1.5">Capacidade Máxima</label><input type="number" className="input-field" placeholder="30" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} required /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
