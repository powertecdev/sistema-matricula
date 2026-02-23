import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(30,41,59,0.5)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          animation: "modalIn 0.25s ease-out",
        }}
        className={sizeMap[size] || sizeMap.md}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(30,41,59,0.5)",
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "16px" }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }} aria-label="Fechar">
            <X style={{ width: "20px", height: "20px", color: "#94a3b8" }} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            padding: "16px 20px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}