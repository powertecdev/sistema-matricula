import { useState, useEffect, useRef } from "react";
import { ScanLine, ArrowLeft, ShieldCheck, ShieldX, User, Clock } from "lucide-react";
import { accessApi } from "../services/api";
import type { AccessResult } from "../types";
import { useNavigate } from "react-router-dom";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<AccessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); const h = () => inputRef.current?.focus(); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  useEffect(() => { if (result||error) { timeoutRef.current = setTimeout(() => { setResult(null); setError(""); setCode(""); inputRef.current?.focus(); }, 8000); } return () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }; }, [result, error]);

  const handleSubmit = async (v: string) => {
    const t = v.trim(); if(!t||loading) return;
    setLoading(true); setResult(null); setError("");
    try { const r = await accessApi.check(t); if(r.data.data) setResult(r.data.data); }
    catch(e:any) { setError(e.response?.data?.error || "Código de Barras nao encontrado"); }
    finally { setLoading(false); setCode(""); }
  };

  const isAuth = result?.status === "AUTHORIZED";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-slate-800/60">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /><span className="text-sm">Voltar</span></button>
        <div className="flex items-center gap-3"><ScanLine className="w-5 h-5 text-brand-400" /><span className="font-display font-semibold text-white">Controle de Acesso - Código de Barras</span></div>
        <div className="w-24" />
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/80 border border-slate-800/50 mb-4">
              <div className={`w-3 h-3 rounded-full ${loading?"bg-amber-400 animate-pulse":"bg-emerald-400 animate-pulse"}`} />
              <span className="text-sm text-slate-300">{loading?"Consultando...":"Aguardando Código de Barras..."}</span>
            </div>
            <div className="relative max-w-sm mx-auto">
              <ScanLine className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input ref={inputRef} value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit(code);}} className="input-field pl-11 text-center font-mono tracking-wider" placeholder="Escaneie o Código de Barras..." autoFocus />
            </div>
          </div>

          {result && (
            <div className={`animate-scale-in rounded-3xl p-8 border-2 ${isAuth?"bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.15)]":"bg-red-950/40 border-red-500/40 shadow-[0_0_80px_rgba(239,68,68,0.15)]"}`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-32 h-32 rounded-full mb-6 ring-4 overflow-hidden ${isAuth?"ring-emerald-500/50":"ring-red-500/50"}`}>
                  {result.photoUrl ? <img src={result.photoUrl} alt={result.name} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center ${isAuth?"bg-emerald-900/50":"bg-red-900/50"}`}><User className="w-16 h-16 text-slate-500" /></div>}
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isAuth?"bg-emerald-500/20":"bg-red-500/20"}`}>
                  {isAuth ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <ShieldX className="w-8 h-8 text-red-400" />}
                </div>
                <h2 className={`text-3xl font-display font-bold mb-2 ${isAuth?"text-emerald-400":"text-red-400"}`}>{isAuth?"AUTORIZADO":"BLOQUEADO"}</h2>
                <p className="text-2xl font-semibold text-white mb-1">{result.name}</p>
                <p className="font-mono text-lg text-slate-400 mb-4">{result.registrationNumber}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                  {result.classroom && <span className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300">{result.classroom}</span>}
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300">{result.message}</span>
                  {result.attendanceRegistered && <span className="px-3 py-1.5 rounded-lg bg-emerald-800/40 text-emerald-300 flex items-center gap-1"><Clock className="w-3 h-3" />Frequencia registrada</span>}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-scale-in rounded-3xl p-8 border-2 bg-red-950/40 border-red-500/40">
              <div className="flex flex-col items-center text-center"><ShieldX className="w-16 h-16 text-red-400 mb-4" /><h2 className="text-2xl font-display font-bold text-red-400 mb-2">NAO ENCONTRADO</h2><p className="text-slate-400">{error}</p></div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="flex flex-col items-center text-center py-12 opacity-40">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-6"><ScanLine className="w-16 h-16 text-slate-600" /></div>
              <p className="text-slate-500 text-lg">Escaneie um Código de Barras</p>
              <p className="text-slate-600 text-sm mt-2">ou cole o UUID e pressione Enter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}