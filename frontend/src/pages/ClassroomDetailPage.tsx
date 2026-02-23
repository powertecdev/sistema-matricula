import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, ShieldCheck, ShieldX } from "lucide-react";
import { classroomApi, enrollmentApi, paymentApi } from "../services/api";
import toast from "react-hot-toast";

interface EnrolledStudent {
  id: string;
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  enrollmentStatus: string;
  paymentStatus: string;
  paymentValidUntil: string | null;
  isExempt: boolean;
  exemptReason: string | null;
  isAuthorized: boolean;
}

export default function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [cRes, eRes] = await Promise.all([
          classroomApi.list(),
          enrollmentApi.list(1, 100),
        ]);
        const classrooms = cRes.data.data || [];
        const cls = classrooms.find((c: any) => c.id === id);
        setClassroom(cls);

        const enrollments = (eRes.data.data || []).filter(
          (e: any) => e.classroomId === id || e.classroom?.id === id
        );

        const mapped: EnrolledStudent[] = enrollments.map((e: any) => {
          const payment = e.payments?.[0];
          const isPaid = payment?.status === "PAID";
          const isExpired = payment?.validUntil && new Date(payment.validUntil) < new Date();
          const isExempt = payment?.isExempt || false;
          const isActive = e.status === "ACTIVE";
          const isAuthorized = isActive && (isExempt || (isPaid && !isExpired));

          return {
            id: e.student?.id || e.studentId,
            name: e.student?.name || "—",
            registrationNumber: e.student?.registrationNumber || "",
            photoUrl: e.student?.photoUrl || null,
            enrollmentStatus: e.status,
            paymentStatus: isPaid ? (isExpired ? "EXPIRED" : "PAID") : "PENDING",
            paymentValidUntil: payment?.validUntil || null,
            isExempt,
            exemptReason: payment?.exemptReason || null,
            isAuthorized,
          };
        });

        mapped.sort((a, b) => {
          if (a.isAuthorized && !b.isAuthorized) return -1;
          if (!a.isAuthorized && b.isAuthorized) return 1;
          return a.name.localeCompare(b.name);
        });

        setStudents(mapped);
      } catch {
        toast.error("Erro ao carregar turma");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const authorized = students.filter((s) => s.isAuthorized).length;
  const blocked = students.filter((s) => !s.isAuthorized).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/classrooms")} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">{classroom?.name || "Turma"}</h1>
          <p className="text-sm text-slate-500">{students.length} aluno(s) matriculado(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 border border-slate-700/50">
          <p className="text-2xl font-bold text-white">{students.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="glass-card p-4 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">{authorized}</p>
          <p className="text-xs text-slate-500">Autorizados</p>
        </div>
        <div className="glass-card p-4 border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{blocked}</p>
          <p className="text-xs text-slate-500">Bloqueados</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="glass-card flex flex-col items-center py-16">
          <Users className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum aluno nesta turma</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="py-3 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Aluno</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Matrícula</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Pagamento</th>
                  <th className="py-3 px-5 text-left text-xs font-semibold text-slate-400 uppercase">Validade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-5">
                      {s.isAuthorized ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold">OK</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <ShieldX className="w-4 h-4 text-red-400" />
                          </div>
                          <span className="text-xs text-red-400 font-semibold">Bloqueado</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center">
                            <span className="text-brand-400 font-bold text-xs">{s.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-mono text-sm text-brand-400">{s.registrationNumber}</span>
                    </td>
                    <td className="py-3 px-5">
                      {s.isExempt ? (
                        <div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Isento</span>
                          {s.exemptReason && <p className="text-[10px] text-slate-500 mt-0.5">{s.exemptReason}</p>}
                        </div>
                      ) : (
                        <span className={s.paymentStatus === "PAID" ? "badge-paid" : s.paymentStatus === "EXPIRED" ? "badge-expired" : "badge-pending"}>
                          {s.paymentStatus === "PAID" ? "Pago" : s.paymentStatus === "EXPIRED" ? "Vencido" : "Pendente"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-sm text-slate-400">
                      {s.paymentValidUntil ? new Date(s.paymentValidUntil).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {students.map((s) => (
              <div key={s.id} className={`glass-card p-4 border ${s.isAuthorized ? "border-emerald-500/20" : "border-red-500/20"}`}>
                <div className="flex items-center gap-3">
                  {s.isAuthorized ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldX className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  {s.photoUrl ? (
                    <img src={s.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 font-bold text-sm">{s.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.registrationNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {s.isExempt ? (
                    <>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Isento</span>
                      {s.exemptReason && <span className="text-[10px] text-amber-400/70">{s.exemptReason}</span>}
                    </>
                  ) : (
                    <span className={s.paymentStatus === "PAID" ? "badge-paid" : s.paymentStatus === "EXPIRED" ? "badge-expired" : "badge-pending"}>
                      {s.paymentStatus === "PAID" ? "Pago" : s.paymentStatus === "EXPIRED" ? "Vencido" : "Pendente"}
                    </span>
                  )}
                  {s.paymentValidUntil && (
                    <span className="text-xs text-slate-500">até {new Date(s.paymentValidUntil).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}