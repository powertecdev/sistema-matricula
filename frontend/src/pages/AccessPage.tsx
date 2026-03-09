import React, { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { studentApi, accessApi } from "../services/api";

type AccessStatus = "AUTHORIZED" | "BLOCKED";
type Mode = "face" | "manual";

interface AccessResult {
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  status: AccessStatus;
  reason?: string;
  className?: string;
  validUntil?: string;
}

interface FaceDescriptorData {
  id: string;
  name: string;
  qrCode: string;
  faceDescriptor: string;
}

interface LabeledDescriptor {
  id: string;
  name: string;
  qrCode: string;
  descriptor: Float32Array;
}

export default function AccessPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionActive = useRef(false);
  const lastRecognizedRef = useRef<string>("");
  const cooldownRef = useRef(false);

  const [mode, setMode] = useState<Mode>("face");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [facesCount, setFacesCount] = useState(0);
  const [descriptors, setDescriptors] = useState<LabeledDescriptor[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Inicializando...");
  const [confidence, setConfidence] = useState(0);
  const [matchedName, setMatchedName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Relogio
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadModels = useCallback(async () => {
    try {
      setStatusMsg("Carregando modelos de IA...");
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      return true;
    } catch {
      setError("Erro ao carregar modelos de IA");
      return false;
    }
  }, []);

  const loadDescriptors = useCallback(async () => {
    try {
      setStatusMsg("Carregando rostos cadastrados...");
      const res = await studentApi.getFaceDescriptors();
      const data: FaceDescriptorData[] = res.data?.data || res.data || [];
      const labeled: LabeledDescriptor[] = data
        .filter((d) => d.faceDescriptor)
        .map((d) => ({
          id: d.id, name: d.name, qrCode: d.qrCode,
          descriptor: new Float32Array(JSON.parse(d.faceDescriptor)),
        }));
      setDescriptors(labeled);
      setFacesCount(labeled.length);
      return labeled;
    } catch (e) {
      console.error("Erro ao carregar descriptors:", e);
      setError("Erro ao carregar rostos cadastrados");
      return [];
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatusMsg("Abrindo camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      return true;
    } catch {
      setError("Camera nao acessivel. Permita o acesso ou use o modo manual.");
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    recognitionActive.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const checkAccess = async (qrCode: string): Promise<AccessResult | null> => {
    try {
      const res = await accessApi.check(qrCode);
      return (res.data?.data || res.data) as AccessResult;
    } catch (e: any) {
      setError(e.response?.data?.message || "Aluno nao encontrado");
      return null;
    }
  };

  const startRecognition = useCallback(async (descs: LabeledDescriptor[]) => {
    if (!videoRef.current || !canvasRef.current || descs.length === 0) return;
    recognitionActive.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const recognize = async () => {
      if (!recognitionActive.current || video.paused || video.ended) return;
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setDetecting(true);
          const box = detection.detection.box;
          let bestMatch: LabeledDescriptor | null = null;
          let bestDist = Infinity;

          for (const desc of descs) {
            const dist = faceapi.euclideanDistance(detection.descriptor, desc.descriptor);
            if (dist < bestDist) { bestDist = dist; bestMatch = desc; }
          }

          const THRESHOLD = 0.55;
          const matched = bestMatch && bestDist < THRESHOLD;
          const conf = Math.round((1 - bestDist) * 100);
          setConfidence(matched ? conf : 0);
          setMatchedName(matched && bestMatch ? bestMatch.name : "");

          const x = box.x, y = box.y, w = box.width, h = box.height;
          const color = matched ? "#00ff88" : "#ff6b35";
          const cornerLen = Math.min(25, w * 0.15);
          const lw = 3;

          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.lineCap = "round";

          // 4 cantos em L
          ctx.beginPath();
          ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
          ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
          ctx.moveTo(x + w, y + h - cornerLen); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - cornerLen, y + h);
          ctx.moveTo(x + cornerLen, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - cornerLen);
          ctx.stroke();

          // Linha horizontal fina no meio
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(x + 5, y + h / 2);
          ctx.lineTo(x + w - 5, y + h / 2);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Label (desfazer espelhamento)
          if (matched && bestMatch) {
            ctx.save();
            ctx.scale(-1, 1);
            const label = `${bestMatch.name}  ${conf}%`;
            ctx.font = "600 12px monospace";
            const tw = ctx.measureText(label).width;
            const lx = -(canvas.width - x - w / 2 + tw / 2 + 8);
            const ly = y - 12;
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.beginPath();
            ctx.roundRect(lx - 2, ly - 13, tw + 16, 22, 4);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.fillText(label, lx + 6, ly + 2);
            ctx.restore();
          }

          if (matched && bestMatch && !cooldownRef.current && lastRecognizedRef.current !== bestMatch.id) {
            cooldownRef.current = true;
            lastRecognizedRef.current = bestMatch.id;
            const accessResult = await checkAccess(bestMatch.qrCode);
            if (accessResult) { setResult(accessResult); setError(""); }
            setTimeout(() => { cooldownRef.current = false; lastRecognizedRef.current = ""; }, 5000);
          }
        } else {
          setDetecting(false);
          setConfidence(0);
          setMatchedName("");
        }
      } catch {}
      if (recognitionActive.current) requestAnimationFrame(recognize);
    };
    setStatusMsg("Reconhecimento ativo");
    recognize();
  }, []);

  useEffect(() => {
    if (mode !== "face") return;
    let cancelled = false;
    const init = async () => {
      setLoading(true); setError("");
      const ok1 = await loadModels(); if (cancelled || !ok1) { setLoading(false); return; }
      const descs = await loadDescriptors(); if (cancelled) { setLoading(false); return; }
      if (descs.length === 0) { setError("Nenhum rosto cadastrado."); setLoading(false); return; }
      const ok2 = await startCamera(); if (cancelled || !ok2) { setLoading(false); return; }
      setLoading(false);
      setTimeout(() => { if (!cancelled) startRecognition(descs); }, 1000);
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, [mode]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => { setResult(null); setError(""); setConfidence(0); setMatchedName(""); }, 8000);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (mode === "manual") { inputRef.current?.focus(); stopCamera(); }
  }, [mode, stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setError("");
    const r = await checkAccess(manualCode.trim());
    if (r) setResult(r);
    setManualCode("");
    inputRef.current?.focus();
  };

  const isAuth = result?.status === "AUTHORIZED";
  const timeStr = currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div style={{ background: "linear-gradient(135deg, #0a0e17 0%, #0d1321 50%, #0a0e17 100%)", minHeight: "100vh" }}>
      <style>{`
        @keyframes scan { 0%{top:5%} 50%{top:90%} 100%{top:5%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulseAuth { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.3)} 50%{box-shadow:0 0 0 20px rgba(0,255,136,0)} }
        @keyframes pulseBlock { 0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,0.3)} 50%{box-shadow:0 0 0 20px rgba(255,59,48,0)} }
        @keyframes glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes borderRun {
          0%{background-position:0% 0%}
          100%{background-position:200% 0%}
        }
        .cam-border {
          background: linear-gradient(90deg, transparent 0%, #00ff8840 25%, #00ff88 50%, #00ff8840 75%, transparent 100%);
          background-size: 200% 100%;
          animation: borderRun 3s linear infinite;
        }
        .result-card { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      {/* Top Bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="w-px h-5 bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: "glow 2s ease-in-out infinite" }} />
              <span className="text-xs text-slate-500 font-mono tracking-wider uppercase">Sistema Ativo</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600 font-mono hidden sm:block">{dateStr}</span>
            <span className="text-sm text-slate-400 font-mono tabular-nums tracking-wider">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Controle de Acesso
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              {mode === "face" ? `FACE-ID // ${facesCount} registro${facesCount !== 1 ? "s" : ""} na base` : "MANUAL // Leitura por codigo"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-800 self-start" style={{ background: "rgba(15,23,42,0.8)" }}>
            <button
              onClick={() => setMode("face")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                mode === "face" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
              style={mode === "face" ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0H5a2 2 0 01-2-2v-4m6 6h10a2 2 0 002-2v-4"/><circle cx="12" cy="11" r="2"/></svg>
              Face ID
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                mode === "manual" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
              style={mode === "manual" ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/></svg>
              Matricula
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera / Input  2 cols */}
          <div className="lg:col-span-2">
            {mode === "face" ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="relative" style={{ aspectRatio: "16/10" }}>
                  {/* Loading */}
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: "#0a0e17" }}>
                      <div className="relative mb-5">
                        <div className="w-24 h-24 rounded-full border-2 border-slate-800" />
                        <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0H5a2 2 0 01-2-2v-4m6 6h10a2 2 0 002-2v-4"/><circle cx="12" cy="11" r="2"/></svg>
                      </div>
                      <p className="text-sm text-slate-400 font-mono">{statusMsg}</p>
                    </div>
                  )}

                  <video ref={videoRef} muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: "scaleX(-1)" }} />

                  {/* Scanline */}
                  {cameraReady && detecting && (
                    <div className="absolute left-[5%] right-[5%] h-px cam-border z-10 pointer-events-none" style={{ animation: "scan 4s ease-in-out infinite" }} />
                  )}

                  {/* Corner guides */}
                  {cameraReady && !loading && (
                    <>
                      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-white/10 rounded-tl-lg pointer-events-none" />
                      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-white/10 rounded-tr-lg pointer-events-none" />
                      <div className="absolute bottom-16 left-4 w-10 h-10 border-b-2 border-l-2 border-white/10 rounded-bl-lg pointer-events-none" />
                      <div className="absolute bottom-16 right-4 w-10 h-10 border-b-2 border-r-2 border-white/10 rounded-br-lg pointer-events-none" />
                    </>
                  )}

                  {/* Bottom HUD */}
                  {!loading && cameraReady && (
                    <div className="absolute bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(to top, rgba(10,14,23,0.95) 0%, transparent 100%)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${detecting ? "bg-green-400" : "bg-slate-600"}`} style={detecting ? { animation: "glow 1s ease-in-out infinite" } : {}} />
                        <span className="text-xs font-mono text-slate-400">
                          {detecting
                            ? matchedName ? `${matchedName} // ${confidence}%` : "DETECTANDO..."
                            : "AGUARDANDO..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-600 tracking-widest">REC</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: "glow 1s ease-in-out infinite" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer bar */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-xs font-mono text-slate-600">{facesCount} FACE{facesCount !== 1 ? "S" : ""} // DB</span>
                  <button
                    onClick={async () => {
                      recognitionActive.current = false;
                      const descs = await loadDescriptors();
                      if (descs.length > 0) startRecognition(descs);
                    }}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
                    SYNC
                  </button>
                </div>
              </div>
            ) : (
              /* Manual */
              <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/></svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Leitura Manual</h2>
                <p className="text-sm text-slate-500 mb-8">Aproxime o cracha ou digite o numero de matricula</p>
                <form onSubmit={handleManualSubmit} className="flex gap-3 max-w-md mx-auto">
                  <input
                    ref={inputRef}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 text-center text-lg font-mono tracking-widest rounded-xl px-4 py-3 border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    style={{ background: "rgba(15,23,42,0.8)", borderColor: "rgba(255,255,255,0.08)", color: "#fff" }}
                    placeholder="MAT-002"
                    autoFocus
                  />
                  <button type="submit" className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                    Verificar
                  </button>
                </form>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-3 px-5 py-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Result  1 col */}
          <div className="lg:col-span-1">
            {result ? (
              <div className="result-card rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${isAuth ? "rgba(0,255,136,0.15)" : "rgba(255,59,48,0.15)"}` }}>
                {/* Color line */}
                <div className="h-1" style={{ background: isAuth ? "linear-gradient(90deg, #00ff88, #10b981)" : "linear-gradient(90deg, #ff3b30, #ef4444)" }} />

                <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-5" style={{ animation: isAuth ? "pulseAuth 2.5s ease-in-out infinite" : "pulseBlock 2.5s ease-in-out infinite" }}>
                    {result.photoUrl ? (
                      <img src={result.photoUrl} alt={result.name}
                        className="w-28 h-28 rounded-full object-cover"
                        style={{ border: `3px solid ${isAuth ? "#00ff88" : "#ff3b30"}` }}
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold"
                        style={{
                          background: isAuth ? "rgba(0,255,136,0.1)" : "rgba(255,59,48,0.1)",
                          border: `3px solid ${isAuth ? "#00ff88" : "#ff3b30"}`,
                          color: isAuth ? "#00ff88" : "#ff3b30",
                        }}>
                        {result.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-xl"
                      style={{ background: isAuth ? "#00ff88" : "#ff3b30" }}>
                      {isAuth
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0e17" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      }
                    </div>
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-bold text-white mb-2">{result.name}</h2>
                  <div className="inline-block px-3 py-1 rounded-md mb-6" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <code className="text-xs font-mono text-indigo-400">{result.registrationNumber}</code>
                  </div>

                  {/* Status */}
                  <div className="w-full rounded-xl py-5 px-4" style={{ background: isAuth ? "rgba(0,255,136,0.06)" : "rgba(255,59,48,0.06)" }}>
                    <p className="text-3xl font-black tracking-tight" style={{ color: isAuth ? "#00ff88" : "#ff3b30" }}>
                      {isAuth ? "AUTORIZADO" : "BLOQUEADO"}
                    </p>
                    {result.reason && <p className="text-xs text-slate-500 mt-2">{result.reason}</p>}
                    {result.validUntil && isAuth && (
                      <p className="text-xs mt-1" style={{ color: "rgba(0,255,136,0.5)" }}>
                        Valido ate {new Date(result.validUntil).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>

                  {/* Confidence bar */}
                  {confidence > 0 && (
                    <div className="flex items-center gap-3 mt-5 w-full max-w-[200px]">
                      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${confidence}%`, background: isAuth ? "#00ff88" : "#ff3b30" }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{confidence}%</span>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="px-6 py-3 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] font-mono text-slate-600">{timeStr} // {dateStr.toUpperCase()}</span>
                </div>
              </div>
            ) : (
              /* Waiting state */
              <div className="rounded-2xl p-10 text-center flex flex-col items-center justify-center" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.04)", minHeight: "360px" }}>
                <div className="w-20 h-20 rounded-full mb-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.5)" strokeWidth="1.5" style={{ animation: "glow 3s ease-in-out infinite" }}>
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0H5a2 2 0 01-2-2v-4m6 6h10a2 2 0 002-2v-4"/><circle cx="12" cy="11" r="2"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">
                  {mode === "face" ? "Posicione o rosto" : "Aguardando leitura"}
                </p>
                <p className="text-xs text-slate-600">
                  {mode === "face" ? "Reconhecimento automatico" : "O leitor funciona como teclado"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}