import React, { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { Camera, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { studentApi } from "../services/api";

interface Props {
  studentId: string;
  onSave: (descriptor: string) => Promise<void>;
  existingDescriptor?: boolean;
}

type Status = "idle" | "loading-models" | "camera-on" | "detecting" | "captured" | "saving" | "saved" | "error";

export default function FaceCapture({ studentId, onSave, existingDescriptor }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string } | null>(null);

  // Carregar modelos do face-api
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return true;
    setStatus("loading-models");
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      return true;
    } catch (e) {
      setError("Erro ao carregar modelos de IA facial");
      setStatus("error");
      return false;
    }
  }, [modelsLoaded]);

  // Iniciar camera
  const startCamera = async () => {
    setError("");
    const loaded = await loadModels();
    if (!loaded) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("camera-on");
      detectFaceLoop();
    } catch (e) {
      setError("Nao foi possivel acessar a camera. Permita o acesso.");
      setStatus("error");
    }
  };

  // Loop de deteccao (mostra feedback em tempo real)
  const detectFaceLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const detect = async () => {
      if (video.paused || video.ended || !streamRef.current) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 }))
        .withFaceLandmarks();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (detection) {
          setFaceDetected(true);
          const box = detection.detection.box;
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Desenhar landmarks
          const landmarks = detection.landmarks.positions;
          ctx.fillStyle = "#22c55e";
          landmarks.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          setFaceDetected(false);
        }
      }

      requestAnimationFrame(detect);
    };

    detect();
  }, []);

  // Capturar face descriptor com verificacao de duplicata
  const captureFace = async () => {
    if (!videoRef.current) return;
    setStatus("detecting");

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError("Nenhum rosto detectado. Centralize o rosto na camera.");
        setStatus("camera-on");
        return;
      }

      // Verificar se rosto ja esta cadastrado em outro aluno
      try {
        const res = await studentApi.getFaceDescriptors();
        const faces = res.data.data || [];
        for (const face of faces) {
          if (face.id === studentId) continue;
          if (!face.faceDescriptor) continue;
          const existing = new Float32Array(JSON.parse(face.faceDescriptor));
          const distance = faceapi.euclideanDistance(detection.descriptor, existing);
          if (distance < 0.45) {
            setDescriptor(detection.descriptor);
            setDuplicateWarning({ name: face.name });
            setStatus("captured");
            return;
          }
        }
      } catch (e) {
        console.warn("Nao foi possivel verificar duplicatas:", e);
      }

      setDescriptor(detection.descriptor);
      setStatus("captured");
    } catch (e) {
      setError("Erro na deteccao facial. Tente novamente.");
      setStatus("camera-on");
    }
  };

  // Salvar descriptor no backend
  const saveDescriptor = async () => {
    if (!descriptor) return;
    setStatus("saving");
    try {
      const descriptorStr = JSON.stringify(Array.from(descriptor));
      await onSave(descriptorStr);
      setStatus("saved");
      stopCamera();
    } catch (e) {
      setError("Erro ao salvar. Tente novamente.");
      setStatus("captured");
    }
  };

  // Parar camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Resetar
  const reset = () => {
    setDescriptor(null);
    setError("");
    setFaceDetected(false);
    setDuplicateWarning(null);
    setStatus("idle");
    stopCamera();
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ border: "1px solid rgba(51,65,85,0.35)", borderRadius: "14px", padding: "16px", background: "rgba(15,23,42,0.5)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Camera size={15} className="text-brand-400" />
          Câmera
        </h3>
        {existingDescriptor && status === "idle" && (
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-medium">
            Rosto já cadastrado
          </span>
        )}
      </div>

      {/* Camera viewport */}
      {(status !== "idle" && status !== "saved") && (
        <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden mb-3">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: "scaleX(-1)" }}
          />
          {/* Overlay com feedback */}
          {status === "camera-on" && (
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-sm ${
              faceDetected
                ? "bg-emerald-500/80 text-white"
                : "bg-yellow-500/80 text-white"
            }`}>
              {faceDetected ? "Rosto detectado - Clique em Capturar" : "Posicione seu rosto na camera..."}
            </div>
          )}
          {status === "detecting" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Loader2 className="text-white animate-spin" size={40} />
            </div>
          )}
          {status === "loading-models" && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm">Carregando modelos de IA...</p>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de sucesso */}
      {status === "saved" && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-3">
          <CheckCircle className="text-emerald-400 shrink-0" size={18} />
          <span className="text-sm text-emerald-400 font-medium">Rosto registrado com sucesso!</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Aviso de rosto similar */}
      {duplicateWarning && status === "captured" && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl mb-3">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm text-amber-400 font-medium">Rosto similar detectado</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Este rosto é parecido com <strong className="text-amber-300">{duplicateWarning.name}</strong>. Pode ser semelhança física natural.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveDescriptor} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <CheckCircle size={13} /> Cadastrar mesmo assim
            </button>
            <button onClick={() => { setDescriptor(null); setDuplicateWarning(null); setStatus("camera-on"); }}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <RefreshCw size={13} /> Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Botoes */}
      <div className="flex gap-2">
        {status === "idle" && (
          <button onClick={startCamera} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
            <Camera size={14} /> {existingDescriptor ? "Recadastrar Rosto" : "Iniciar Câmera"}
          </button>
        )}

        {status === "camera-on" && (
          <>
            <button onClick={captureFace} disabled={!faceDetected}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-40">
              <Camera size={13} /> Capturar Rosto
            </button>
            <button onClick={reset} className="btn-secondary text-xs py-2 px-4">Cancelar</button>
          </>
        )}

        {status === "captured" && !duplicateWarning && (
          <>
            <button onClick={saveDescriptor} className="btn-success text-xs py-2 px-4 flex items-center gap-1.5">
              <CheckCircle size={14} /> Confirmar e Salvar
            </button>
            <button onClick={() => { setDescriptor(null); setStatus("camera-on"); }}
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
              <RefreshCw size={14} /> Tentar Novamente
            </button>
          </>
        )}

        {status === "saving" && (
          <button disabled className="btn-primary text-xs py-2 px-4 opacity-60">
            <Loader2 size={14} className="animate-spin" /> Salvando...
          </button>
        )}

        {status === "saved" && (
          <button onClick={reset} className="btn-secondary text-xs py-2 px-4">
            <RefreshCw size={14} /> Recadastrar
          </button>
        )}
      </div>
    </div>
  );
}