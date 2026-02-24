import { useEffect, useState } from "react";
import { CreditCard, Plus, Calendar } from "lucide-react";
import { paymentApi, enrollmentApi } from "../services/api";
import type { Payment, Enrollment } from "../types";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

const methodLabels: Record<string, { label: string; color: string }> = {
  PIX: { label: "PIX", color: "bg-emerald-500/15 text-emerald-400" },
  CARTAO_CREDITO: { label: "Credito", color: "bg-blue-500/15 text-blue-400" },
  CARTAO_DEBITO: { label: "Debito", color: "bg-cyan-500/15 text-cyan-400" },
  DINHEIRO: { label: "Dinheiro", color: "bg-amber-500/15 text-amber-400" },
  BOLETO: { label: "Boleto", color: "bg-purple-500/15 text-purple-400" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ id: string; name: string } | null>(null);
  const [confirmMethod, setConfirmMethod] = useState("");
  const [confirmValidUntil, setConfirmValidUntil] = useState("");
  const [form, setForm] = useState({ enrollmentId: "", amount: "", validUntil: "", method: "", isExempt: false, exemptReason: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([paymentApi.list(1, 100), enrollmentApi.list(1, 50)]);
      setPayments(pRes.data.data || []);
      setEnrollments(eRes.data.data || []);
    } catch { toast.error("Erro ao carregar"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentApi.create({
        enrollmentId: form.enrollmentId,
        amount: Number(form.amount),
        validUntil: form.validUntil || undefined,
        method: form.method || undefined,
        isExempt: form.isExempt || false,
        exemptReason: form.exemptReason || undefined,
      });
      toast.success("Pagamento criado!");
      setShowCreate(false);
      setForm({ enrollmentId: "", amount: "", validUntil: "", method: "", isExempt: false, exemptReason: "" });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  const closeConfirmModal = () => { setConfirmModal(null); setConfirmMethod(""); setConfirmValidUntil(""); };

  const handleConfirmPayment = async () => {
    if (!confirmModal || !confirmMethod) { toast.error("Selecione a forma de pagamento"); return; }
    try {
      await paymentApi.updateStatus(confirmModal.id, "PAID", confirmMethod, confirmValidUntil || undefined);
      toast.success("Pagamento confirmado!");
      closeConfirmModal();
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  const handleSetPending = async (id: string) => {
    try {
      await paymentApi.updateStatus(id, "PENDING");
      toast.success("Marcado como pendente!");
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || "Erro"); }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const isExpired = (validUntil: string | null | undefined) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const MethodBadge = ({ method }: { method?: string }) => {
    if (!method) return <span className="text-xs text-slate-600">-</span>;
    const m = methodLabels[method] || { label: method, color: "bg-slate-500/15 text-slate-400" };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${m.color}`}>{m.label}</span>;
  };

  const paymentMethods = [
    { value: "PIX", label: "PIX" },
    { value: "CARTAO_CREDITO", label: "Credito" },
    { value: "CARTAO_DEBITO", label: "Debito" },
    { value: "DINHEIRO", label: "Dinheiro" },
    { value: "BOLETO", label: "Boleto" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">Pagamentos</h1>
          <p className="text-sm text-slate-500">Controle financeiro</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> <span>Novo Pagamento</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" /></div>
      ) : payments.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <CreditCard className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum pagamento</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Aluno</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Turma</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Valor</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Forma</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Pago em</th>
                    <th className="py-4 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Validade</th>
                    <th className="py-4 px-5 text-right text-xs font-semibold text-slate-400 uppercase">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-5 text-sm text-white font-medium">{p.enrollment?.student?.name || ""}</td>
                      <td className="py-4 px-5 text-sm text-slate-300">{p.enrollment?.classroom?.name || ""}</td>
                      <td className="py-4 px-5 text-sm font-mono text-white">R$ {p.amount?.toFixed(2)}</td>
                      <td className="py-4 px-5"><MethodBadge method={p.method} /></td>
                      <td className="py-4 px-5">
                        <span className={p.status === "PAID" ? "badge-paid" : "badge-pending"}>{p.status === "PAID" ? "Pago" : "Pendente"}</span>
                        {p.isExempt && <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Isento</span>}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-400">
                        {p.status === "PAID" && p.paidAt ? (<span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-500" />{formatDate(p.paidAt)}</span>) : ""}
                      </td>
                      <td className="py-4 px-5 text-sm">
                        {p.validUntil ? (<span className={isExpired(p.validUntil) ? "text-red-400" : "text-slate-400"}>{formatDate(p.validUntil)}{isExpired(p.validUntil) && <span className="ml-1 badge-expired">vencido</span>}</span>) : ""}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {p.status === "PAID" ? (
                          <button onClick={() => handleSetPending(p.id)} className="btn-danger text-xs px-3 py-1.5">Pendente</button>
                        ) : (
                          <button onClick={() => setConfirmModal({ id: p.id, name: p.enrollment?.student?.name || "Aluno" })} className="btn-success text-xs px-3 py-1.5">Confirmar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {payments.map((p: any) => (
              <div key={p.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.enrollment?.student?.name || ""}</p>
                    <p className="text-xs text-slate-500">{p.enrollment?.classroom?.name || ""}</p>
                  </div>
                  <span className="text-sm font-mono text-white font-bold">R$ {p.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={p.status === "PAID" ? "badge-paid" : "badge-pending"}>{p.status === "PAID" ? "Pago" : "Pendente"}</span>
                  <MethodBadge method={p.method} />
                  {p.isExempt && <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Isento</span>}
                </div>
                {p.status === "PAID" && p.paidAt && (<div className="flex items-center gap-1.5 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5 text-emerald-500" />Pago em {formatDate(p.paidAt)}</div>)}
                {p.validUntil && (<div className="text-xs text-slate-500">Validade: <span className={isExpired(p.validUntil) ? "text-red-400" : ""}>{formatDate(p.validUntil)}</span></div>)}
                <div className="pt-2 border-t border-slate-800/40">
                  {p.status === "PAID" ? (
                    <button onClick={() => handleSetPending(p.id)} className="w-full btn-danger text-xs py-2">Marcar Pendente</button>
                  ) : (
                    <button onClick={() => setConfirmModal({ id: p.id, name: p.enrollment?.student?.name || "Aluno" })} className="w-full btn-success text-xs py-2">Confirmar Pagamento</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={!!confirmModal} onClose={closeConfirmModal} title="Confirmar Pagamento" size="md">
        <div className="space-y-5">
          <p className="text-sm text-slate-400">Confirmar pagamento de <span className="text-white font-semibold">{confirmModal?.name}</span></p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Forma de pagamento</label>
            <div className="grid grid-cols-5 gap-2">
              {paymentMethods.map((m) => (
                <button key={m.value} type="button" onClick={() => setConfirmMethod(m.value)}
                  className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all ${confirmMethod === m.value ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30" : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-slate-300"}`}>
                  <span className="text-[11px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Valido ate</label>
            <input type="date" className="input-field w-full" value={confirmValidUntil} onChange={(e) => setConfirmValidUntil(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Data de vencimento deste pagamento</p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/50">
            <button type="button" onClick={closeConfirmModal} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleConfirmPayment} disabled={!confirmMethod} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Confirmar Pagamento</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo Pagamento">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Matricula</label>
            <select className="input-field" value={form.enrollmentId} onChange={(e) => setForm({ ...form, enrollmentId: e.target.value })} required>
              <option value="">Selecione...</option>
              {enrollments.map((en: any) => (<option key={en.id} value={en.id}>{en.student?.name} - {en.classroom?.name}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isExempt} onChange={(e) => setForm({ ...form, isExempt: e.target.checked, amount: e.target.checked ? "0" : form.amount })} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-700 peer-checked:bg-amber-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
            <span className="text-sm text-slate-300">Isento de pagamento</span>
          </div>
          {form.isExempt && (<div><label className="block text-sm text-slate-400 mb-1.5">Motivo da isencao</label><input className="input-field" placeholder="Ex: Bolsista, funcionario, cortesia..." value={form.exemptReason} onChange={(e) => setForm({ ...form, exemptReason: e.target.value })} /></div>)}
          {!form.isExempt && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-slate-400 mb-1.5">Valor (R$)</label><input type="number" step="0.01" className="input-field" placeholder="500.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div><label className="block text-sm text-slate-400 mb-1.5">Forma de Pagamento</label>
                <select className="input-field" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="">Nao informado</option>
                  <option value="PIX">PIX</option>
                  <option value="CARTAO_CREDITO">Cartao Credito</option>
                  <option value="CARTAO_DEBITO">Cartao Debito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>
            </div>
          )}
          <div><label className="block text-sm text-slate-400 mb-1.5">Valido ate</label><input type="date" className="input-field" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}