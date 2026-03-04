import React, { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { ScanLine, ShieldCheck, ShieldX, Camera, Keyboard, Loader2, RefreshCw, AlertCircle } from "lucide-react";
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

  // Carregar modelos
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

  // Carregar descriptors dos alunos
  const loadDescriptors = useCallback(async () => {
    try {
      setStatusMsg("Carregando rostos cadastrados...");
      const res = await studentApi.getFaceDescriptors();
      const data: FaceDescriptorData[] = res.data?.data || res.data || [];

      const labeled: LabeledDescriptor[] = data
        .filter((d) => d.faceDescriptor)
        .map((d) => ({
          id: d.id,
          name: d.name,
          qrCode: d.qrCode,
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

  // Iniciar camera
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

  // Parar camera
  const stopCamera = useCallback(() => {
    recognitionActive.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Verificar acesso via API
  const checkAccess = async (qrCode: string): Promise<AccessResult | null> => {
    try {
      const res = await accessApi.check(qrCode);
      const d = res.data?.data || res.data;
      return d as AccessResult;
    } catch (e: any) {
      const msg = e.response?.data?.message || "Aluno nao encontrado";
      setError(msg);
      return null;
    }
  };

  // Loop de reconhecimento facial
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

          // Encontrar o mais proximo
          let bestMatch: LabeledDescriptor | null = null;
          let bestDist = Infinity;

          for (const desc of descs) {
            const dist = faceapi.euclideanDistance(detection.descriptor, desc.descriptor);
            if (dist < bestDist) {
              bestDist = dist;
              bestMatch = desc;
            }
          }

          const THRESHOLD = 0.55; // Mais baixo = mais rigoroso
          const matched = bestMatch && bestDist < THRESHOLD;

          // Desenhar box
          ctx.strokeStyle = matched ? "#22c55e" : "#f59e0b";
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Label
          if (matched && bestMatch) {
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(box.x, box.y - 28, box.width, 28);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(`${bestMatch.name} (${(1 - bestDist).toFixed(0)}%)`, box.x + 6, box.y - 8);
          } else {
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(box.x, box.y - 28, box.width, 28);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText("Nao reconhecido", box.x + 6, box.y - 8);
          }

          // Se reconheceu e nao esta em cooldown
          if (matched && bestMatch && !cooldownRef.current && lastRecognizedRef.current !== bestMatch.id) {
            cooldownRef.current = true;
            lastRecognizedRef.current = bestMatch.id;

            const accessResult = await checkAccess(bestMatch.qrCode);
            if (accessResult) {
              setResult(accessResult);
              setError("");
            }

            // Cooldown de 5 segundos
            setTimeout(() => {
              cooldownRef.current = false;
              lastRecognizedRef.current = "";
            }, 5000);
          }
        } else {
          setDetecting(false);
        }
      } catch (e) {
        // Silently continue
      }

      if (recognitionActive.current) {
        requestAnimationFrame(recognize);
      }
    };

    setStatusMsg("Reconhecimento ativo");
    recognize();
  }, []);

  // Init modo facial
  useEffect(() => {
    if (mode !== "face") return;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError("");

      const modelsOk = await loadModels();
      if (cancelled || !modelsOk) { setLoading(false); return; }

      const descs = await loadDescriptors();
      if (cancelled) { setLoading(false); return; }

      if (descs.length === 0) {
        setError("Nenhum rosto cadastrado. Cadastre rostos dos alunos primeiro.");
        setLoading(false);
        return;
      }

      const cameraOk = await startCamera();
      if (cancelled || !cameraOk) { setLoading(false); return; }

      setLoading(false);
      setStatusMsg("Reconhecimento ativo");

      // Pequeno delay para camera estabilizar
      setTimeout(() => {
        if (!cancelled) startRecognition(descs);
      }, 1000);
    };

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode]);

  // Auto-limpar resultado
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => { setResult(null); setError(""); }, 8000);
    return () => clearTimeout(t);
  }, [result]);

  // Focus no input manual
  useEffect(() => {
    if (mode === "manual") {
      inputRef.current?.focus();
      stopCamera();
    }
  }, [mode, stopCamera]);

  // Submit manual
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setError("");
    const accessResult = await checkAccess(manualCode.trim());
    if (accessResult) { setResult(accessResult); }
    setManualCode("");
    inputRef.current?.focus();
  };

  const isAuth = result?.status === "AUTHORIZED";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header com toggle de modo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Outfit" }}>
            Controle de Acesso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "face" ? `Reconhecimento facial (${facesCount} rostos cadastrados)` : "Leitura por matricula/cracha"}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setMode("face")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "face" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Camera size={16} /> Face ID
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Keyboard size={16} /> Matricula
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda: Camera ou Input */}
        <div>
          {mode === "face" ? (
            <div className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-900">
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-10">
                    <Loader2 className="animate-spin mb-3" size={40} />
                    <p className="text-sm text-gray-400">{statusMsg}</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Status bar */}
                {!loading && cameraReady && (
                  <div className={`absolute bottom-0 left-0 right-0 px-4 py-2 text-xs font-semibold text-white ${
                    detecting ? "bg-emerald-600/80" : "bg-gray-800/80"
                  }`}>
                    {detecting ? "Rosto detectado - Analisando..." : "Aguardando rosto..."}
                  </div>
                )}
              </div>
              {/* Refresh button */}
              {!loading && (
                <div className="p-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400">{facesCount} rostos na base</span>
                  <button
                    onClick={async () => {
                      recognitionActive.current = false;
                      const descs = await loadDescriptors();
                      if (descs.length > 0) startRecognition(descs);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Atualizar base
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <ScanLine className="text-indigo-600" size={28} />
                </div>
                <p className="text-sm text-gray-500">Aproxime o cracha ou digite a matricula</p>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="input text-center text-lg font-mono tracking-wider flex-1"
                  placeholder="MAT-2025-001"
                  autoFocus
                />
                <button type="submit" className="btn-primary px-6">Verificar</button>
              </form>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Coluna direita: Resultado */}
        <div>
          {result ? (
            <div
              className={`card p-8 text-center border-2 ${isAuth ? "border-emerald-300" : "border-red-300"}`}
              style={{
                animation: "slideUp 0.4s ease-out",
                boxShadow: isAuth
                  ? "0 0 40px rgba(34, 197, 94, 0.2)"
                  : "0 0 40px rgba(239, 68, 68, 0.2)",
              }}
            >
              {/* Foto */}
              <div className="flex justify-center mb-4">
                {result.photoUrl ? (
                  <img
                    src={result.photoUrl}
                    alt={result.name}
                    className={`w-28 h-28 rounded-full object-cover border-4 ${isAuth ? "border-emerald-400" : "border-red-400"}`}
                  />
                ) : (
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold ${
                    isAuth ? "bg-emerald-100 text-emerald-700 border-4 border-emerald-400" : "bg-red-100 text-red-700 border-4 border-red-400"
                  }`}>
                    {result.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Info */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{result.name}</h2>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded-lg font-mono text-indigo-700 inline-block mb-4">
                {result.registrationNumber}
              </code>

              {/* Status grande */}
              <div className={`flex items-center justify-center gap-3 px-6 py-5 rounded-2xl mx-auto max-w-xs ${
                isAuth ? "bg-emerald-50" : "bg-red-50"
              }`}>
                {isAuth ? (
                  <ShieldCheck className="text-emerald-600" size={44} />
                ) : (
                  <ShieldX className="text-red-600" size={44} />
                )}
                <div className="text-left">
                  <p className={`text-2xl font-extrabold ${isAuth ? "text-emerald-700" : "text-red-700"}`}>
                    {isAuth ? "AUTORIZADO" : "BLOQUEADO"}
                  </p>
                  {result.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">{result.reason}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="text-gray-300 mb-4">
                {mode === "face" ? (
                  <Camera size={64} className="mx-auto opacity-30" />
                ) : (
                  <ScanLine size={64} className="mx-auto opacity-30" />
                )}
              </div>
              <p className="text-sm text-gray-400">
                {mode === "face"
                  ? "Posicione o rosto na camera para identificacao"
                  : "Aguardando leitura do cracha..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}