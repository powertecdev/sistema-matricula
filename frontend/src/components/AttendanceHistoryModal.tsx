import { useEffect, useState } from "react";
import { attendanceApi } from "../services/api";
import type { AttendanceRecord } from "../types";
import Modal from "./Modal";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function AttendanceHistoryModal({ isOpen, onClose, studentId, studentName }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [histRes, countRes] = await Promise.all([
        attendanceApi.getByStudent(studentId, page, limit),
        attendanceApi.getCountByStudent(studentId),
      ]);
      setRecords(histRes.data.data || []);
      const countTotal = countRes.data.data?.totalAttendances || 0;
      const paginationTotal = histRes.data.pagination?.total || histRes.data.meta?.total || 0;
      setTotal(Math.max(countTotal, paginationTotal));
    } catch (err) {
      console.error("Erro ao carregar historico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDayOfWeek = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { weekday: "long" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico  ${studentName}`} size="md">
      <div className="space-y-3">
        {/* Contador */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <CalendarCheck className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <span className="text-sm text-violet-300">
            <strong className="text-violet-200 text-lg">{total}</strong> presenças registradas
          </span>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Nenhuma presença registrada</p>
        ) : (
          <div className="space-y-2">
            {records.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{formatDateTime(r.createdAt)}</p>
                    <p className="text-xs text-slate-500 capitalize">{formatDayOfWeek(r.createdAt)}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-mono flex-shrink-0 ml-2">
                  #{((page - 1) * limit) + i + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500">
              {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}