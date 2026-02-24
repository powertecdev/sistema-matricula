import { useEffect, useState } from "react";
import { Users, BookOpen, CreditCard, AlertCircle, CalendarCheck, TrendingUp, School, DollarSign, ShieldCheck, ShieldX } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { studentApi, enrollmentApi, paymentApi, attendanceApi, classroomApi } from "../services/api";
import toast from "react-hot-toast";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, enrollments: 0, paid: 0, pending: 0, exempt: 0, attendanceToday: 0, attendanceTotal: 0, totalRevenue: 0 });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [classroomData, setClassroomData] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, e, p, a, daily, summary, cls] = await Promise.all([
          studentApi.list(1, 1),
          enrollmentApi.list(1, 1),
          paymentApi.list(1, 100),
          attendanceApi.getStats(),
          attendanceApi.getDaily(14),
          attendanceApi.getSummary(),
          classroomApi.list(),
        ]);

        const payments = p.data.data || [];
        const attStats = a.data.data || { total: 0, today: 0 };
        const paidPayments = payments.filter((x: any) => x.status === "PAID");
        const pendingPayments = payments.filter((x: any) => x.status === "PENDING");
        const exemptPayments = payments.filter((x: any) => x.isExempt);
        const totalRevenue = paidPayments.reduce((sum: number, x: any) => sum + (x.amount || 0), 0);

        setStats({
          students: s.data.meta?.total || 0,
          enrollments: e.data.meta?.total || 0,
          paid: paidPayments.length,
          pending: pendingPayments.length,
          exempt: exemptPayments.length,
          attendanceToday: attStats.today,
          attendanceTotal: attStats.total,
          totalRevenue,
        });

        // Daily attendance chart
        const dailyRaw = daily.data.data || [];
        setDailyData(dailyRaw.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          presencas: d.count,
        })));

        // Payment method distribution
        const methodMap: any = {};
        paidPayments.forEach((p: any) => {
          const m = p.method || "Nao informado";
          const label = m === "PIX" ? "PIX" : m === "CARTAO_CREDITO" ? "Cartao Credito" : m === "CARTAO_DEBITO" ? "Cartao Debito" : m === "DINHEIRO" ? "Dinheiro" : m === "BOLETO" ? "Boleto" : "Nao informado";
          methodMap[label] = (methodMap[label] || 0) + 1;
        });
        setPaymentMethodData(Object.entries(methodMap).map(([name, value]) => ({ name, value })));

        // Classroom occupancy
        const classrooms = cls.data.data || [];
        setClassroomData(classrooms.map((c: any) => ({
          name: c.name,
          alunos: c._count?.enrollments || 0,
          capacidade: c.maxCapacity,
          pct: Math.round(((c._count?.enrollments || 0) / c.maxCapacity) * 100),
        })));

        // Top 5 ranking
        const summaryData = summary.data.data || [];
        setRanking(summaryData.slice(0, 5));

        // Recent payments
        setRecentPayments(paidPayments.slice(0, 5));

      } catch { toast.error("Erro ao carregar dashboard"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>;

  const cards = [
    { label: "Total Alunos", value: stats.students, icon: Users, border: "border-brand-500/20", bg: "bg-brand-600/10", text: "text-brand-400" },
    { label: "Matriculas Ativas", value: stats.enrollments, icon: BookOpen, border: "border-cyan-500/20", bg: "bg-cyan-600/10", text: "text-cyan-400" },
    { label: "Pagos", value: stats.paid, icon: CreditCard, border: "border-emerald-500/20", bg: "bg-emerald-600/10", text: "text-emerald-400" },
    { label: "Pendentes", value: stats.pending, icon: AlertCircle, border: "border-amber-500/20", bg: "bg-amber-600/10", text: "text-amber-400" },
    { label: "Isentos", value: stats.exempt, icon: ShieldCheck, border: "border-violet-500/20", bg: "bg-violet-600/10", text: "text-violet-400" },
    { label: "Presencas Hoje", value: stats.attendanceToday, icon: CalendarCheck, border: "border-pink-500/20", bg: "bg-pink-600/10", text: "text-pink-400" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-slate-400 text-xs">{label}</p>
          <p className="text-white font-bold">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-display font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-slate-500">Visao geral do sistema</p>
        </div>
        <div className="glass-card px-4 py-2 border border-emerald-500/20">
          <p className="text-xs text-slate-400">Receita Total</p>
          <p className="text-lg font-bold text-emerald-400">R$ {stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => (
          <div key={i} className={`glass-card p-4 border ${c.border}`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`p-2 rounded-xl ${c.bg} w-fit mb-2`}><c.icon className={`w-4 h-4 ${c.text}`} /></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance Line Chart */}
        <div className="lg:col-span-2 glass-card p-5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-semibold text-white">Frequencia - Ultimos 14 dias</h3>
          </div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="presencas" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-10">Sem dados de frequencia</p>}
        </div>

        {/* Payment Methods Pie */}
        <div className="glass-card p-5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-white">Formas de Pagamento</h3>
          </div>
          {paymentMethodData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {paymentMethodData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {paymentMethodData.map((d: any, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : <p className="text-slate-500 text-center py-10">Sem pagamentos</p>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Classroom Occupancy */}
        <div className="glass-card p-5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-semibold text-white">Ocupacao das Turmas</h3>
          </div>
          {classroomData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={classroomData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 11 }} width={120} />
                <Tooltip content={({ active, payload }: any) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-white font-bold">{d.name}</p>
                        <p className="text-slate-400 text-xs">{d.alunos}/{d.capacidade} ({d.pct}%)</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="alunos" radius={[0, 6, 6, 0]}>
                  {classroomData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.pct >= 90 ? "#EF4444" : d.pct >= 70 ? "#F59E0B" : "#10B981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-center py-10">Sem turmas</p>}
        </div>

        {/* Ranking + Recent Payments */}
        <div className="space-y-5">
          {/* Top 5 Ranking */}
          <div className="glass-card p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-semibold text-white">Top 5 Frequencia</h3>
            </div>
            {ranking.length > 0 ? (
              <div className="space-y-2">
                {ranking.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/50 text-slate-500"}`}>{i + 1}</span>
                      <span className="text-sm text-white">{r.studentName || r.name}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-400">{r.count || r.total} <span className="text-xs text-slate-500 font-normal">presencas</span></span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-center py-4">Sem dados</p>}
          </div>

          {/* Recent Payments */}
          <div className="glass-card p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-semibold text-white">Ultimos Pagamentos</h3>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-sm text-white">{p.enrollment?.student?.name || ""}</p>
                      <p className="text-xs text-slate-500">{p.method || "Sem metodo"}  {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : ""}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">R$ {(p.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-center py-4">Sem pagamentos</p>}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="glass-card p-4 border border-slate-700/50 flex flex-wrap items-center justify-center gap-6 text-center">
        <div><p className="text-2xl font-bold text-brand-400">{stats.attendanceTotal}</p><p className="text-xs text-slate-500">Presencas Totais</p></div>
        <div className="w-px h-8 bg-slate-700 hidden sm:block" />
        <div><p className="text-2xl font-bold text-emerald-400">R$ {stats.totalRevenue.toFixed(2)}</p><p className="text-xs text-slate-500">Receita Total</p></div>
        <div className="w-px h-8 bg-slate-700 hidden sm:block" />
        <div><p className="text-2xl font-bold text-cyan-400">{classroomData.length}</p><p className="text-xs text-slate-500">Turmas</p></div>
        <div className="w-px h-8 bg-slate-700 hidden sm:block" />
        <div><p className="text-2xl font-bold text-amber-400">{stats.pending}</p><p className="text-xs text-slate-500">Pgtos Pendentes</p></div>
      </div>
    </div>
  );
}