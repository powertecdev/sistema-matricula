import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, Upload, Trash2, Edit, ScanBarcode, CalendarCheck, Camera } from "lucide-react";
import { studentApi, classroomApi, attendanceApi } from "../services/api";
import type { Student, Classroom } from "../types";
import Modal from "../components/Modal";
import AttendanceHistoryModal from "../components/AttendanceHistoryModal";
import StudentFaceModal from "../components/StudentFaceModal";
import toast from "react-hot-toast";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"create"|"edit"|"upload"|"qr"|null>(null);
  const [selected, setSelected] = useState<Student|null>(null);
  const [form, setForm] = useState({ registrationNumber:"", name:"", age:"", address:"", phone:"", classroomId:"", paymentAmount:"", paymentValidUntil:"", isTrial: false, trialExpiresAt:"", isExempt: false, exemptReason:"" });
  const [qrData, setQrData] = useState<any>(null);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string,number>>({});
  const [historyStudent, setHistoryStudent] = useState<{id:string;name:string}|null>(null);
  const [faceStudent, setFaceStudent] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([studentApi.list(page, 10, search), classroomApi.list()]);
      const studs = r.data.data||[];
      setStudents(studs);
      setMeta(r.data.meta);
      setClassrooms(c.data.data||[]);
      const counts: Record<string,number> = {};
      await Promise.all(studs.map(async (s: Student) => {
        try { const cr = await attendanceApi.getCountByStudent(s.id); counts[s.id] = cr.data.data?.totalAttendances || 0; }
        catch { counts[s.id] = 0; }
      }));
      setAttendanceCounts(counts);
    }
    catch(e:any) { toast.error(e.response?.data?.error||"Erro"); }
    finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(modal==="create") {
        const payload: any = { registrationNumber: form.registrationNumber, name: form.name, age: Number(form.age), address: form.address, phone: form.phone };
        if (form.classroomId) payload.classroomId = form.classroomId;
        if (form.isExempt) { payload.isExempt = true; payload.exemptReason = form.exemptReason; payload.paymentAmount = 0; }
        if (form.paymentAmount) payload.paymentAmount = Number(form.paymentAmount);
        if (form.isTrial && form.trialExpiresAt) {
          payload.paymentValidUntil = form.trialExpiresAt;
          payload.paymentAmount = 0;
        } else if (form.paymentValidUntil) {
          payload.paymentValidUntil = form.paymentValidUntil;
        }
        await studentApi.create(payload);
        toast.success("Aluno cadastrado!");
      }
      else if(modal==="edit"&&selected) {
        await studentApi.update(selected.id,{name:form.name,age:Number(form.age),address:form.address,phone:form.phone});
        toast.success("Atualizado!");
      }
      setModal(null); load();
    } catch(e:any) { toast.error(e.response?.data?.error||"Erro"); }
  };

  const showQR = async (s: Student) => {
    try { const r = await studentApi.getQRCode(s.id); setQrData(r.data.data); setSelected(s); setModal("qr"); }
    catch(e:any) { toast.error("Erro ao gerar QR"); }
  };

  const openCreate = () => {
    setForm({ registrationNumber:"", name:"", age:"", address:"", phone:"", classroomId:"", paymentAmount:"", paymentValidUntil:"", isTrial: false, trialExpiresAt:"", isExempt: false, exemptReason:"" });
    setModal("create");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-3xl font-display font-bold text-white mb-1">Alunos</h1><p className="text-sm text-slate-500">Gerenciar alunos e Codigos de Barras</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start"><Plus className="w-4 h-4" /> Novo Aluno</button>
      </div>
      <div className="glass-card p-4"><div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" /><input className="input-field pl-11" placeholder="Buscar..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} /></div></div>

      {loading ? <div className="flex justify-center py-20"><div className="w-12 h-12 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>
      : students.length===0 ? <div className="glass-card flex flex-col items-center py-16"><Users className="w-12 h-12 text-slate-600 mb-4" /><p className="text-slate-400">Nenhum aluno</p></div>
      : <>
        {/* Desktop */}
        <div className="glass-card overflow-hidden hidden md:block"><table className="w-full">
          <thead><tr className="border-b border-slate-800/60">{["Aluno","Matricula","Idade","Frequencia","Telefone","Acoes"].map(h=><th key={h} className={`py-4 px-5 text-xs font-semibold text-slate-400 uppercase ${h==="Acoes"?"text-right":h==="Frequencia"?"text-center":"text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{students.map(s=>(
            <tr key={s.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
              <td className="py-4 px-5"><div className="flex items-center gap-3">
                {s.photoUrl?<img src={s.photoUrl} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700" />:<div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center ring-2 ring-slate-700"><span className="text-brand-400 font-bold text-sm">{s.name.charAt(0)}</span></div>}
                <div><p className="text-sm font-medium text-white">{s.name}</p><p className="text-xs text-slate-500 truncate max-w-[200px]">{s.address}</p></div>
              </div></td>
              <td className="py-4 px-5"><span className="font-mono text-sm text-brand-400 bg-brand-600/10 px-2.5 py-1 rounded-lg">{s.registrationNumber}</span></td>
              <td className="py-4 px-5 text-sm text-slate-300 text-center">{s.age}</td>
              <td className="py-4 px-5 text-center">
                <button onClick={()=>setHistoryStudent({id:s.id,name:s.name})} className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/15 text-violet-400 rounded-full text-sm font-bold hover:bg-violet-500/25 transition-colors">
                  <CalendarCheck className="w-3.5 h-3.5" />{attendanceCounts[s.id]||0}
                </button>
              </td>
              <td className="py-4 px-5 text-sm text-slate-300">{s.phone}</td>
              <td className="py-4 px-5"><div className="flex items-center justify-end gap-1">
                <button onClick={()=>setFaceStudent(s)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors" title="Face ID"><Camera className="w-4 h-4" /></button>
                <button onClick={()=>showQR(s)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors" title="Codigo de Barras"><ScanBarcode className="w-4 h-4" /></button>
                <button onClick={()=>{setSelected(s);setModal("upload");}} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors" title="Foto"><Upload className="w-4 h-4" /></button>
                <button onClick={()=>{setSelected(s);setForm({...form,registrationNumber:s.registrationNumber,name:s.name,age:String(s.age),address:s.address,phone:s.phone});setModal("edit");}} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                <button onClick={async()=>{if(confirm("Remover "+s.name+"?")){await studentApi.delete(s.id);toast.success("Removido!");load();}}} className="p-2 rounded-lg hover:bg-red-600/10 text-slate-400 hover:text-red-400 transition-colors" title="Remover"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}</tbody></table>
          {meta&&meta.totalPages>1&&<div className="flex items-center justify-between p-4 border-t border-slate-800/60"><p className="text-sm text-slate-500">{meta.total} aluno(s)</p><div className="flex gap-2"><button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1} className="btn-secondary text-sm px-3 py-1.5">Anterior</button><span className="flex items-center text-sm text-slate-400 px-3">{page}/{meta.totalPages}</span><button onClick={()=>setPage(Math.min(meta.totalPages,page+1))} disabled={page===meta.totalPages} className="btn-secondary text-sm px-3 py-1.5">Proxima</button></div></div>}
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {students.map(s=>(
            <div key={s.id} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                {s.photoUrl?<img src={s.photoUrl} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700" />:<div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center ring-2 ring-slate-700"><span className="text-brand-400 font-bold">{s.name.charAt(0)}</span></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{s.registrationNumber}</p>
                </div>
                <button onClick={()=>setHistoryStudent({id:s.id,name:s.name})} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/15 text-violet-400 rounded-full text-sm font-bold">
                  <CalendarCheck className="w-3.5 h-3.5" />{attendanceCounts[s.id]||0}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-slate-500">Idade:</span> <span className="text-slate-300">{s.age}</span></div>
                <div><span className="text-slate-500">Tel:</span> <span className="text-slate-300">{s.phone}</span></div>
              </div>
              <p className="text-xs text-slate-500 truncate mb-3">{s.address}</p>
              <div className="flex items-center gap-1 border-t border-slate-800/40 pt-3">
                <button onClick={()=>setFaceStudent(s)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors" title="Face ID"><Camera className="w-4 h-4" /></button>
                <button onClick={()=>showQR(s)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors"><ScanBarcode className="w-4 h-4" /></button>
                <button onClick={()=>{setSelected(s);setModal("upload");}} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"><Upload className="w-4 h-4" /></button>
                <button onClick={()=>{setSelected(s);setForm({...form,registrationNumber:s.registrationNumber,name:s.name,age:String(s.age),address:s.address,phone:s.phone});setModal("edit");}} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"><Edit className="w-4 h-4" /></button>
                <div className="flex-1" />
                <button onClick={async()=>{if(confirm("Remover "+s.name+"?")){await studentApi.delete(s.id);toast.success("Removido!");load();}}} className="p-2 rounded-lg hover:bg-red-600/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {meta&&meta.totalPages>1&&<div className="flex items-center justify-center gap-3 pt-2"><button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1} className="btn-secondary text-sm px-3 py-1.5">Anterior</button><span className="text-sm text-slate-400">{page}/{meta.totalPages}</span><button onClick={()=>setPage(Math.min(meta.totalPages,page+1))} disabled={page===meta.totalPages} className="btn-secondary text-sm px-3 py-1.5">Proxima</button></div>}
        </div>
      </>}

      <Modal isOpen={modal==="create"||modal==="edit"} onClose={()=>setModal(null)} title={modal==="create"?"Novo Aluno":"Editar Aluno"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {modal==="create"&&<div><label className="block text-sm text-slate-400 mb-1.5">N Matricula</label><input className="input-field" placeholder="MAT-0004" value={form.registrationNumber} onChange={e=>setForm({...form,registrationNumber:e.target.value})} required /></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm text-slate-400 mb-1.5">Nome</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><label className="block text-sm text-slate-400 mb-1.5">Idade</label><input type="number" className="input-field" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required /></div>
          </div>
          <div><label className="block text-sm text-slate-400 mb-1.5">Telefone</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
          <div><label className="block text-sm text-slate-400 mb-1.5">Endereco</label><input className="input-field" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required /></div>

          {modal==="create"&&<>
            <div className="border-t border-slate-800/60 pt-4 mt-2">
              <p className="text-sm font-medium text-slate-300 mb-3">Matricula e Pagamento</p>
            </div>
            <div><label className="block text-sm text-slate-400 mb-1.5">Turma</label>
              <select className="input-field" value={form.classroomId} onChange={e=>setForm({...form,classroomId:e.target.value})}>
                <option value="">Selecione uma turma...</option>
                {classrooms.map(c=><option key={c.id} value={c.id}>{c.name} ({c._count?.enrollments||0}/{c.maxCapacity} alunos)</option>)}
              </select>
            </div>

            {form.classroomId&&<>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isExempt} onChange={e=>setForm({...form,isExempt:e.target.checked,paymentAmount:e.target.checked?"0":form.paymentAmount})} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-700 peer-checked:bg-amber-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <span className="text-sm text-slate-300">Isento de pagamento</span>
              </div>
              {form.isExempt && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Motivo da isencao</label>
                  <input className="input-field" placeholder="Ex: Bolsista, funcionario, cortesia..." value={form.exemptReason} onChange={e=>setForm({...form,exemptReason:e.target.value})} />
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isTrial} onChange={e=>setForm({...form,isTrial:e.target.checked,paymentAmount:e.target.checked?"0":form.paymentAmount})} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
                <span className="text-sm text-slate-300">Aula Experimental</span>
              </div>

              {form.isTrial ? (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Expira em</label>
                  <input type="date" className="input-field" value={form.trialExpiresAt} onChange={e=>setForm({...form,trialExpiresAt:e.target.value})} required />
                  <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg mt-2">Aula experimental gratuita - acesso ate a data selecionada</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-slate-400 mb-1.5">Valor (R$)</label><input type="number" step="0.01" className="input-field" placeholder="500.00" value={form.paymentAmount} onChange={e=>setForm({...form,paymentAmount:e.target.value})} /></div>
                    <div><label className="block text-sm text-slate-400 mb-1.5">Valido ate</label><input type="date" className="input-field" value={form.paymentValidUntil} onChange={e=>setForm({...form,paymentValidUntil:e.target.value})} /></div>
                  </div>
                  <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">Pagamento sera criado com status PENDENTE automaticamente</p>
                </>
              )}
            </>}
          </>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{modal==="create"?"Cadastrar":"Salvar"}</button></div>
        </form>
      </Modal>

      <Modal isOpen={modal==="upload"} onClose={()=>setModal(null)} title="Upload Foto" size="sm">
        <p className="text-sm text-slate-400 mb-4">Foto para <span className="text-white font-medium">{selected?.name}</span></p>
        <input type="file" accept="image/*" className="input-field" onChange={async(e)=>{if(e.target.files?.[0]&&selected){try{await studentApi.uploadPhoto(selected.id,e.target.files[0]);toast.success("Foto atualizada!");setModal(null);load();}catch(err:any){toast.error("Erro");}}}} />
      </Modal>

      <Modal isOpen={modal==="qr"} onClose={()=>setModal(null)} title="Codigo de Barras" size="sm">
        {qrData&&<div className="flex flex-col items-center">
          <img src={qrData.qrCodeImage} alt="Codigo de Barras" className="w-full max-w-[320px] rounded-xl mb-4 bg-white p-3" />
          <p className="text-lg font-semibold text-white mb-1">{qrData.studentName}</p>
          <p className="font-mono text-sm text-brand-400 mb-3">{qrData.registrationNumber}</p>
          <p className="text-xs text-slate-500 bg-slate-800/60 px-3 py-2 rounded-lg font-mono break-all select-all mb-4">{qrData.qrCode}</p>
          <button
            onClick={() => {
              const w = window.open("", "_blank", "width=450,height=350");
              if (w) {
                w.document.write(`<!DOCTYPE html><html><head><title>Codigo - ${qrData.studentName}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;background:#fff}img{max-width:350px;margin-bottom:12px}h2{margin:0;font-size:18px}p{margin:4px 0;color:#666;font-size:13px}.mono{font-family:monospace;font-size:11px;color:#999}@media print{body{padding:20px}}</style></head><body><img src="${qrData.qrCodeImage}" /><h2>${qrData.studentName}</h2><p>${qrData.registrationNumber}</p><p class="mono">${qrData.qrCode}</p><script>setTimeout(()=>{window.print();},300);<\/script></body></html>`);
                w.document.close();
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir Codigo de Barras
          </button>
          <p className="text-xs text-slate-600 mt-2">Use na tela de acesso</p>
        </div>}
      </Modal>

      {historyStudent && (
        <AttendanceHistoryModal
          isOpen={!!historyStudent}
          onClose={()=>setHistoryStudent(null)}
          studentId={historyStudent.id}
          studentName={historyStudent.name}
        />
      )}

      <StudentFaceModal
        student={faceStudent}
        isOpen={!!faceStudent}
        onClose={() => setFaceStudent(null)}
        onToast={(msg: string, type: "success" | "error") => type === "success" ? toast.success(msg) : toast.error(msg)}
      />
    </div>
  );
}