import { useState } from "react";
import { FileText, Download, Users, CreditCard, CalendarCheck, School } from "lucide-react";
import { studentApi, paymentApi, attendanceApi, classroomApi, enrollmentApi } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [loading, setLoading] = useState("");

  const header = (doc: jsPDF, title: string) => {
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Sistema de Matricula", 14, 18);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 30);
    const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    doc.setFontSize(9);
    doc.text(`Gerado em: ${now}`, doc.internal.pageSize.width - 14, 30, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  const footer = (doc: jsPDF) => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Pagina ${i} de ${pages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
      doc.text("Enrollment System v2.1", 14, doc.internal.pageSize.height - 10);
    }
  };

  const generateStudentReport = async () => {
    setLoading("students");
    try {
      const res = await studentApi.list(1, 500);
      const students = res.data.data || [];
      const doc = new jsPDF();
      header(doc, "Relatorio de Alunos");

      autoTable(doc, {
        startY: 48,
        head: [["#", "Matricula", "Nome", "Idade", "Telefone", "Endereco"]],
        body: students.map((s: any, i: number) => [
          i + 1,
          s.registrationNumber,
          s.name,
          s.age,
          s.phone,
          s.address,
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 48 },
      });

      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("Resumo", 14, finalY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Total de alunos: ${students.length}`, 14, finalY + 8);

      footer(doc);
      doc.save("relatorio-alunos.pdf");
      toast.success("Relatorio de alunos gerado!");
    } catch { toast.error("Erro ao gerar relatorio"); }
    finally { setLoading(""); }
  };

  const generatePaymentReport = async () => {
    setLoading("payments");
    try {
      const res = await paymentApi.list(1, 500);
      const payments = res.data.data || [];
      const doc = new jsPDF("landscape");
      header(doc, "Relatorio de Pagamentos");

      const methodLabel = (m: string | null) => {
        if (!m) return "";
        const map: any = { PIX: "PIX", CARTAO_CREDITO: "Cartao Cred.", CARTAO_DEBITO: "Cartao Deb.", DINHEIRO: "Dinheiro", BOLETO: "Boleto" };
        return map[m] || m;
      };

      autoTable(doc, {
        startY: 48,
        head: [["#", "Aluno", "Turma", "Valor", "Forma", "Status", "Isento", "Pago em", "Validade"]],
        body: payments.map((p: any, i: number) => [
          i + 1,
          p.enrollment?.student?.name || "",
          p.enrollment?.classroom?.name || "",
          `R$ ${(p.amount || 0).toFixed(2)}`,
          methodLabel(p.method),
          p.status === "PAID" ? "Pago" : "Pendente",
          p.isExempt ? "Sim" : "Nao",
          p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "",
          p.validUntil ? new Date(p.validUntil).toLocaleDateString("pt-BR") : "",
        ]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          3: { halign: "right" },
          5: { fontStyle: "bold" },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 5 && data.section === "body") {
            if (data.cell.raw === "Pago") data.cell.styles.textColor = [16, 185, 129];
            if (data.cell.raw === "Pendente") data.cell.styles.textColor = [239, 68, 68];
          }
        },
        margin: { top: 48 },
      });

      const paid = payments.filter((p: any) => p.status === "PAID");
      const pending = payments.filter((p: any) => p.status === "PENDING");
      const exempt = payments.filter((p: any) => p.isExempt);
      const revenue = paid.reduce((s: number, p: any) => s + (p.amount || 0), 0);

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("Resumo Financeiro", 14, finalY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Total de pagamentos: ${payments.length}`, 14, finalY + 8);
      doc.text(`Pagos: ${paid.length} | Pendentes: ${pending.length} | Isentos: ${exempt.length}`, 14, finalY + 15);
      doc.setFont("helvetica", "bold");
      doc.text(`Receita total: R$ ${revenue.toFixed(2)}`, 14, finalY + 22);

      footer(doc);
      doc.save("relatorio-pagamentos.pdf");
      toast.success("Relatorio de pagamentos gerado!");
    } catch { toast.error("Erro ao gerar relatorio"); }
    finally { setLoading(""); }
  };

  const generateAttendanceReport = async () => {
    setLoading("attendance");
    try {
      const [summaryRes, dailyRes, statsRes] = await Promise.all([
        attendanceApi.getSummary(),
        attendanceApi.getDaily(30),
        attendanceApi.getStats(),
      ]);
      const summary = summaryRes.data.data || [];
      const daily = dailyRes.data.data || [];
      const stats = statsRes.data.data || { total: 0, today: 0 };

      const doc = new jsPDF();
      header(doc, "Relatorio de Frequencia");

      // Stats
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("Estatisticas Gerais", 14, 52);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Total de presencas registradas: ${stats.total}`, 14, 60);
      doc.text(`Presencas hoje: ${stats.today}`, 14, 67);
      doc.text(`Alunos com presenca: ${summary.length}`, 14, 74);

      // Ranking table
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("Ranking de Frequencia", 14, 88);

      autoTable(doc, {
        startY: 93,
        head: [["Pos.", "Aluno", "Total de Presencas"]],
        body: summary.map((s: any, i: number) => [
          `${i + 1}o`,
          s.studentName || s.name,
          s.count || s.total,
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 2: { halign: "center" } },
      });

      // Daily breakdown
      if (daily.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        if (finalY > 240) doc.addPage();
        const startY2 = finalY > 240 ? 50 : finalY;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(124, 58, 237);
        doc.text("Presencas por Dia (ultimos 30 dias)", 14, startY2);

        autoTable(doc, {
          startY: startY2 + 5,
          head: [["Data", "Presencas"]],
          body: daily.map((d: any) => [
            new Date(d.date).toLocaleDateString("pt-BR"),
            d.count,
          ]),
          styles: { fontSize: 9, cellPadding: 2.5 },
          headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 1: { halign: "center" } },
        });
      }

      footer(doc);
      doc.save("relatorio-frequencia.pdf");
      toast.success("Relatorio de frequencia gerado!");
    } catch { toast.error("Erro ao gerar relatorio"); }
    finally { setLoading(""); }
  };

  const generateClassroomReport = async () => {
    setLoading("classrooms");
    try {
      const res = await classroomApi.list();
      const classrooms = res.data.data || [];
      const doc = new jsPDF();
      header(doc, "Relatorio de Turmas");

      autoTable(doc, {
        startY: 48,
        head: [["#", "Turma", "Capacidade", "Alunos", "Vagas", "Ocupacao"]],
        body: classrooms.map((c: any, i: number) => {
          const count = c._count?.enrollments || 0;
          const pct = Math.round((count / c.maxCapacity) * 100);
          return [
            i + 1,
            c.name,
            c.maxCapacity,
            count,
            c.maxCapacity - count,
            `${pct}%`,
          ];
        }),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 5 && data.section === "body") {
            const val = parseInt(data.cell.raw);
            if (val >= 90) data.cell.styles.textColor = [239, 68, 68];
            else if (val >= 70) data.cell.styles.textColor = [245, 158, 11];
            else data.cell.styles.textColor = [16, 185, 129];
          }
        },
      });

      const totalCapacity = classrooms.reduce((s: number, c: any) => s + c.maxCapacity, 0);
      const totalEnrolled = classrooms.reduce((s: number, c: any) => s + (c._count?.enrollments || 0), 0);
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("Resumo", 14, finalY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Total de turmas: ${classrooms.length}`, 14, finalY + 8);
      doc.text(`Capacidade total: ${totalCapacity} | Matriculados: ${totalEnrolled} | Vagas: ${totalCapacity - totalEnrolled}`, 14, finalY + 15);

      footer(doc);
      doc.save("relatorio-turmas.pdf");
      toast.success("Relatorio de turmas gerado!");
    } catch { toast.error("Erro ao gerar relatorio"); }
    finally { setLoading(""); }
  };

  const generateFullReport = async () => {
    setLoading("full");
    try {
      toast("Gerando relatorio completo...", { icon: "" });
      await generateStudentReport();
      await generatePaymentReport();
      await generateAttendanceReport();
      await generateClassroomReport();
      toast.success("Todos os relatorios gerados!");
    } catch { toast.error("Erro"); }
    finally { setLoading(""); }
  };

  const reports = [
    { id: "students", title: "Relatorio de Alunos", desc: "Lista completa com dados pessoais, matricula e contato", icon: Users, color: "brand", fn: generateStudentReport },
    { id: "payments", title: "Relatorio de Pagamentos", desc: "Detalhamento financeiro, formas de pagamento e status", icon: CreditCard, color: "emerald", fn: generatePaymentReport },
    { id: "attendance", title: "Relatorio de Frequencia", desc: "Ranking de presencas, estatisticas e historico diario", icon: CalendarCheck, color: "violet", fn: generateAttendanceReport },
    { id: "classrooms", title: "Relatorio de Turmas", desc: "Ocupacao, capacidade e vagas disponiveis", icon: School, color: "cyan", fn: generateClassroomReport },
  ];

  const colorMap: any = {
    brand: { border: "border-brand-500/20", bg: "bg-brand-600/10", text: "text-brand-400", btn: "bg-brand-600 hover:bg-brand-500" },
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-600/10", text: "text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-500" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-600/10", text: "text-violet-400", btn: "bg-violet-600 hover:bg-violet-500" },
    cyan: { border: "border-cyan-500/20", bg: "bg-cyan-600/10", text: "text-cyan-400", btn: "bg-cyan-600 hover:bg-cyan-500" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-display font-bold text-white mb-1">Relatorios</h1>
          <p className="text-sm text-slate-500">Exportar dados em PDF</p>
        </div>
        <button onClick={generateFullReport} disabled={loading === "full"} className="btn-primary flex items-center gap-2">
          {loading === "full" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
          Gerar Todos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((r) => {
          const c = colorMap[r.color];
          return (
            <div key={r.id} className={`glass-card p-6 border ${c.border} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${c.bg}`}><r.icon className={`w-5 h-5 ${c.text}`} /></div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{r.title}</h3>
                    <p className="text-xs text-slate-500">{r.desc}</p>
                  </div>
                </div>
              </div>
              <button onClick={r.fn} disabled={loading === r.id} className={`mt-4 w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all ${c.btn} disabled:opacity-50`}>
                {loading === r.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FileText className="w-4 h-4" /> Gerar PDF</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}