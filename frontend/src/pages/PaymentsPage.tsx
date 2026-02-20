import { useEffect, useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { paymentApi, enrollmentApi } from "../services/api";
import type { Payment, Enrollment } from "../types";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ enrollmentId: "", amount: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        paymentApi.list(1, 50),
        enrollmentApi.list(1, 50),
      ]);
      setPayments(pRes.data.data || []);
      setEnrollments(eRes.data.data || []);
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
      await paymentApi.create({
        enrollmentId: form.enrollmentId,
        amount: Number(form.amount),
      });
      toast.success("Pagamento criado!");
      setShowCreate(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    try {
      await paymentApi.updateStatus(
        id,
        current === "PAID" ? "PENDING" : "PAID"
      );
      toast.success("Status atualizado!");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            Pagamentos
          </h1>
          <p className="text-slate-500">Controle financeiro</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Pagamento
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <CreditCard className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum pagamento</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-400 uppercase">
                  Aluno
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-400 uppercase">
                  Turma
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-400 uppercase">
                  Valor
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-400 uppercase">
                  Status
                </th>
                <th className="py-4 px-6 text-right text-xs font-semibold text-slate-400 uppercase">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-white font-medium">
                    {p.enrollment?.student?.name || "—"}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-300">
                    {p.enrollment?.classroom?.name || "—"}
                  </td>
                  <td className="py-4 px-6 text-sm font-mono text-white">
                    R$ {p.amount?.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={
                        p.status === "PAID" ? "badge-paid" : "badge-pending"
                      }
                    >
                      {p.status === "PAID" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => toggleStatus(p.id, p.status)}
                      className={
                        p.status === "PAID"
                          ? "btn-danger text-xs px-3 py-1.5"
                          : "btn-success text-xs px-3 py-1.5"
                      }
                    >
                      {p.status === "PAID"
                        ? "Marcar Pendente"
                        : "Confirmar Pgto"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo Pagamento"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Matrícula
            </label>
            <select
              className="input-field"
              value={form.enrollmentId}
              onChange={(e) =>
                setForm({ ...form, enrollmentId: e.target.value })
              }
              required
            >
              <option value="">Selecione...</option>
              {enrollments.map((en: any) => (
                <option key={en.id} value={en.id}>
                  {en.student?.name} - {en.classroom?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="500.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
