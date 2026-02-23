import { useEffect, useState } from "react";
import { attendanceApi } from "../services/api";
import type { AttendanceSummary, DailyAttendance, AttendanceStats } from "../types";
import { CalendarCheck, TrendingUp, Users, Clock, Trophy, Medal } from "lucide-react";
import AttendanceHistoryModal from "../components/AttendanceHistoryModal";

export default function AttendancePage() {
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [daily, setDaily] = useState<DailyAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sumRes, dailyRes, statsRes] = await Promise.all([
        attendanceApi.getSummary(),
        attendanceApi.getDaily(days),
        attendanceApi.getStats(),
      ]);
      setSummary(sumRes.data.data || []);
      setDaily(dailyRes.data.data || []);
      setStats(statsRes.data.data || { total: 0, today: 0 });
    } catch (err) {
      console.error("Erro ao carregar frequência:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const maxCount = Math.max(...daily.map((d) => d.count), 1);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs text-slate-500 font-bold">{index + 1}</span>;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">
          Frequência
        </h1>
        <p className="text-sm text-slate-500">Acompanhamento de presenças dos alunos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 border border-violet-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <CalendarCheck className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Total de Presenças</p>
        </div>

        <div className="glass-card p-4 sm:p-5 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.today}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Presenças Hoje</p>
        </div>

        <div className="glass-card p-4 sm:p-5 border border-blue-500/20 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {summary.filter((s) => s.totalAttendances > 0).length}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Alunos com Presença</p>
        </div>
      </div>

      {/* Gráfico de Frequência Diária */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold text-white">Presenças por Dia</h2>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  days === d
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Barras do gráfico */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-end gap-1 sm:gap-1.5" style={{ minWidth: daily.length > 14 ? `${daily.length * 28}px` : "100%", height: "200px" }}>
            {daily.map((d) => {
              const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end gap-1 min-w-[20px]"
                  style={{ height: "100%" }}
                >
                  {d.count > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">{d.count}</span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.count === 0
                        ? "bg-slate-800/50"
                        : "bg-gradient-to-t from-violet-600 to-violet-400"
                    }`}
                    style={{
                      height: d.count === 0 ? "2px" : `${Math.max(height, 8)}%`,
                    }}
                    title={`${formatDate(d.date)}: ${d.count} presença(s)`}
                  />
                  <span className="text-[9px] sm:text-[10px] text-slate-600 -rotate-45 sm:rotate-0 origin-top-left sm:origin-center whitespace-nowrap">
                    {formatDate(d.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de Alunos */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800/50">
          <h2 className="text-lg font-bold text-white">Ranking de Frequência</h2>
        </div>

        {/* Desktop: tabela */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left w-12">#</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Aluno</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Presenças</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Última Presença</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s, i) => (
                <tr key={s.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-6">{getRankIcon(i)}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                          <span className="text-violet-400 font-bold text-xs">{s.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{s.registrationNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/15 text-violet-400 rounded-full text-sm font-bold">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {s.totalAttendances}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(s.lastAttendance)}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Histórico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-slate-800/40">
          {summary.map((s, i) => (
            <div
              key={s.id}
              className="p-4 hover:bg-slate-800/20 transition-colors cursor-pointer"
              onClick={() => setSelectedStudent(s)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{getRankIcon(i)}</div>
                {s.photoUrl ? (
                  <img src={s.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-400 font-bold text-sm">{s.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{s.registrationNumber}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/15 text-violet-400 rounded-full text-sm font-bold">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {s.totalAttendances}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-1">{formatDateTime(s.lastAttendance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Histórico */}
      {selectedStudent && (
        <AttendanceHistoryModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
        />
      )}
    </div>
  );
}