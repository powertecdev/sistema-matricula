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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           style={{ animation: "slideUp 0.4s ease-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Outfit" }}>
            Cadastro Facial
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Info do aluno */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{student.name}</h3>
              <code className="text-xs bg-gray-200 px-2 py-0.5 rounded font-mono text-indigo-700">
                {student.registrationNumber}
              </code>
              <div className="flex items-center gap-2 mt-1">
                <Camera size={12} className="text-gray-400" />
                <span className={`text-xs font-medium ${hasFace ? "text-emerald-600" : "text-amber-600"}`}>
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