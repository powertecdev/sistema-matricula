import { useEffect, useState } from "react";
import { Users, BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import { studentApi, enrollmentApi, paymentApi, classroomApi } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, enrollments: 0, paid: 0, pending: 0, classrooms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentApi.list(1, 1), enrollmentApi.list(1, 1), paymentApi.list(1, 100), classroomApi.list()])
      .then(([s, e, p, c]) => {
        const payments = (p.data.data || []) as any[];
        setStats({
          students: s.data.meta?.total || 0,
          enrollments: e.data.meta?.total || 0,
          paid: payments.filter((x: any) => x.status === "PAID").length,
          pending: payments.filter((x: any) => x.status === "PENDING").length,
          classrooms: Array.isArray(c.data.data) ? c.data.data.length : 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total de Alunos", value: stats.students, icon: Users, gradient: "from-brand-600/20 to-brand-600/5", border: "border-brand-500/20", iconBg: "bg-brand-600/20", iconColor: "text-brand-400" },
    { label: "Matrículas Ativas", value: stats.enrollments, icon: BookOpen, gradient: "from-cyan-600/20 to-cyan-600/5", border: "border-cyan-500/20", iconBg: "bg-cyan-600/20", iconColor: "text-cyan-400" },
    { label: "Pagos", value: stats.paid, icon: ShieldCheck, gradient: "from-emerald-600/20 to-emerald-600/5", border: "border-emerald-500/20", iconBg: "bg-emerald-600/20", iconColor: "text-emerald-400" },
    { label: "Pendentes", value: stats.pending, icon: AlertCircle, gradient: "from-amber-600/20 to-amber-600/5", border: "border-amber-500/20", iconBg: "bg-amber-600/20", iconColor: "text-amber-400" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-500">Visão geral do sistema de matrículas</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 animate-pulse"><div className="h-4 bg-slate-800 rounded w-24 mb-4" /><div className="h-8 bg-slate-800 rounded w-16" /></div>)
          : cards.map((c, i) => (
            <div key={c.label} className={`glass-card p-6 bg-gradient-to-br ${c.gradient} border ${c.border} animate-slide-up`} style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400 font-medium">{c.label}</span>
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}><c.icon className={`w-5 h-5 ${c.iconColor}`} /></div>
              </div>
              <p className="text-3xl font-display font-bold text-white">{c.value}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}
