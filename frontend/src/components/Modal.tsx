import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; size?: "sm" | "md" | "lg"; }

export default function Modal({ isOpen, onClose, title, children, size = "md" }: Props) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-card ${w} w-full mx-4 p-6 animate-scale-in shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
