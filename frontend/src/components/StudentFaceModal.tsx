import React, { useState, useEffect } from "react";
import { X, User, Camera } from "lucide-react";
import { studentApi } from "../services/api";
import FaceCapture from "./FaceCapture";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  photoUrl: string | null;
  faceDescriptor?: string | null;
  age: number;
  phone: string;
  address: string;
}

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string, type: "success" | "error") => void;
}

export default function StudentFaceModal({ student, isOpen, onClose, onToast }: Props) {
  const [hasFace, setHasFace] = useState(false);

  useEffect(() => {
    if (student) {
      setHasFace(!!student.faceDescriptor);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSaveFace = async (descriptor: string) => {
    await studentApi.updateFace(student.id, descriptor);
    setHasFace(true);
    onToast?.("Rosto registrado com sucesso!", "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: "overlayIn 0.2s ease-out" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(9,15,28,0.98) 100%)",
          border: "1px solid rgba(51,65,85,0.4)",
          borderRadius: "20px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
          animation: "modalIn 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(51,65,85,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={15} style={{ color: "#10b981" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              Cadastro Facial
            </h2>
          </div>
          <button onClick={onClose} aria-label="Fechar modal" style={{ padding: "6px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#64748b", transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(51,65,85,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Info do aluno */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", padding: "14px 16px", background: "rgba(51,65,85,0.2)", border: "1px solid rgba(51,65,85,0.3)", borderRadius: "14px" }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.name} width={56} height={56}
                style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(51,65,85,0.5)", flexShrink: 0 }} />
            ) : (
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#10b981", flexShrink: 0 }}>
                {student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.name}</h3>
              <code style={{ fontSize: "11px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)", padding: "2px 8px", borderRadius: "6px", fontFamily: '"JetBrains Mono", monospace', color: "#34d399", letterSpacing: "0.05em" }}>
                {student.registrationNumber}
              </code>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: hasFace ? "#10b981" : "#f59e0b", boxShadow: hasFace ? "0 0 6px rgba(16,185,129,0.6)" : "0 0 6px rgba(245,158,11,0.6)", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 500, color: hasFace ? "#10b981" : "#f59e0b" }}>
                  {hasFace ? "Rosto cadastrado" : "Sem rosto cadastrado"}
                </span>
              </div>
            </div>
          </div>

          {/* FaceCapture */}
          <FaceCapture
            studentId={student.id}
            onSave={handleSaveFace}
            existingDescriptor={hasFace}
          />
        </div>
      </div>
    </div>
  );
}