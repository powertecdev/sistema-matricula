import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, Upload, Trash2, Edit } from "lucide-react";
import { studentApi } from "../services/api";
import type { Student } from "../types";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState<"create" | "edit" | "upload" | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [form, setForm] = useState({ registrationNumber: "", name: "", age: "", address: "", phone: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.list(page, 10, search);
      setStudents(res.data.data || []);
      setMeta(res.data.meta);
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro ao carregar"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showModal === "create") {
        await studentApi.create({ ...form, age: Number(form.age) });
        toast.success("Aluno cadastrado!");
      } else if (showModal === "edit" && selected) {
        await studentApi.update(selected.id, { name: form.name, age: Number(form.age), address: form.address, phone: form.phone });
        toast.success("Aluno atualizado!");
      }
      setShowModal(null);
      setForm({ registrationNumber: "", name: "", age: "", address: "", phone: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  const handlePhoto = async (file: File) => {
    if (!selected) return;
    try {
      await studentApi.uploadPhoto(selected.id, file);
      toast.success("Foto atualizada!");
      setShowModal(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro no upload"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Alunos</h1>
          <p className="text-slate-500">Gerenciar cadastro de alunos</p>
        </div>
        <button onClick={() => { setForm({ registrationNumber: "", name: "", age: "", address: "", phone: "" }); setShowModal("create"); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Aluno
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input className="input-field pl-11" placeholder="Buscar por nome ou matrícula..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : students.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <Users className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-800/60">
                {["Aluno", "Matrícula", "Idade", "Telefone", "Ações"].map(h => (
                  <th key={h} className={`py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center ring-2 ring-slate-700">
                            <span className="text-brand-400 font-bold text-sm">{s.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{s.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{s.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><span className="font-mono text-sm text-brand-400 bg-brand-600/10 px-2.5 py-1 rounded-lg">{s.registrationNumber}</span></td>
                    <td className="py-4 px-6 text-sm text-slate-300">{s.age}</td>
                    <td className="py-4 px-6 text-sm text-slate-300">{s.phone}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(s); setShowModal("upload"); }} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors" title="Upload foto"><Upload className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(s); setForm({ registrationNumber: s.registrationNumber, name: s.name, age: String(s.age), address: s.address, phone: s.phone }); setShowModal("edit"); }} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={async () => { if (confirm(`Remover "${s.name}"?`)) { await studentApi.delete(s.id); toast.success("Removido!"); load(); } }} className="p-2 rounded-lg hover:bg-red-600/10 text-slate-400 hover:text-red-400 transition-colors" title="Remover"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800/60">
              <p className="text-sm text-slate-500">{meta.total} aluno(s)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1.5">Anterior</button>
                <span className="flex items-center text-sm text-slate-400 px-3">{page}/{meta.totalPages}</span>
                <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages} className="btn-secondary text-sm px-3 py-1.5">Próxima</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal === "create" || showModal === "edit"} onClose={() => setShowModal(null)} title={showModal === "create" ? "Novo Aluno" : "Editar Aluno"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {showModal === "create" && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Nº Matrícula</label>
              <input className="input-field" placeholder="MAT-0001" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1.5">Nome</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="block text-sm text-slate-400 mb-1.5">Idade</label><input type="number" className="input-field" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></div>
          </div>
          <div><label className="block text-sm text-slate-400 mb-1.5">Telefone</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          <div><label className="block text-sm text-slate-400 mb-1.5">Endereço</label><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{showModal === "create" ? "Cadastrar" : "Salvar"}</button>
          </div>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={showModal === "upload"} onClose={() => setShowModal(null)} title="Upload de Foto" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Selecione uma foto para <span className="text-white font-medium">{selected?.name}</span></p>
          <input type="file" accept="image/*" className="input-field" onChange={(e) => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]); }} />
        </div>
      </Modal>
    </div>
  );
}
