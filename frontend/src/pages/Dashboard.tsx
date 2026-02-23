import { useEffect, useState } from "react";
import { Users, BookOpen, CreditCard, AlertCircle, CalendarCheck } from "lucide-react";
import { studentApi, enrollmentApi, paymentApi, attendanceApi } from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, enrollments: 0, paid: 0, pending: 0, attendanceToday: 0, attendanceTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, e, p, a] = await Promise.all([
          studentApi.list(1, 1),
          enrollmentApi.list(1, 1),
          paymentApi.list(1, 100),
          attendanceApi.getStats(),
        ]);
        const payments = p.data.data || [];
        const attStats = a.data.data || { total: 0, today: 0 };
        setStats({
          students: s.data.meta?.total || 0,
          enrollments: e.data.meta?.total || 0,
          paid: payments.filter((x: any) => x.status === "PAID").length,
          pending: payments.filter((x: any) => x.status === "PENDING").length,
          attendanceToday: attStats.today,
          attendanceTotal: attStats.total,
        });
      } catch { toast.error("Erro ao carregar stats"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>;

  const cards = [
    { label: "Alunos", value: stats.students, icon: Users, color: "brand", border: "border-brand-500/20", bg: "bg-brand-600/10", text: "text-brand-400" },
    { label: "Matriculas", value: stats.enrollments, icon: BookOpen, color: "cyan", border: "border-cyan-500/20", bg: "bg-cyan-600/10", text: "text-cyan-400" },
    { label: "Pagos", value: stats.paid, icon: CreditCard, color: "emerald", border: "border-emerald-500/20", bg: "bg-emerald-600/10", text: "text-emerald-400" },
    { label: "Pendentes", value: stats.pending, icon: AlertCircle, color: "amber", border: "border-amber-500/20", bg: "bg-amber-600/10", text: "text-amber-400" },
    { label: "Presencas Hoje", value: stats.attendanceToday, icon: CalendarCheck, color: "violet", border: "border-violet-500/20", bg: "bg-violet-600/10", text: "text-violet-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-xl sm:text-3xl font-display font-bold text-white mb-1">Dashboard</h1><p className="text-sm text-slate-500">Visao geral do sistema</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`glass-card p-4 sm:p-5 border ${c.border} ${i===4?"col-span-2 sm:col-span-1":""}`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${c.bg}`}><c.icon className={`w-5 h-5 ${c.text}`} /></div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{c.value}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}