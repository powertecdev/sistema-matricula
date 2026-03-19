import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, CreditCard, ScanLine, School, CalendarCheck, MessageSquare, FileText, Zap } from "lucide-react";

const nav = [
  { path: "/",            label: "Dashboard",  icon: LayoutDashboard },
  { path: "/students",    label: "Alunos",      icon: Users           },
  { path: "/enrollments", label: "Matrículas",  icon: BookOpen        },
  { path: "/payments",    label: "Pagamentos",  icon: CreditCard      },
  { path: "/classrooms",  label: "Turmas",      icon: School          },
  { path: "/attendance",  label: "Frequência",  icon: CalendarCheck   },
  { path: "/reports",     label: "Relatórios",  icon: FileText        },
  { path: "/feedback",    label: "Feedback",    icon: MessageSquare   },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside
        style={{
          width: "256px",
          background: "linear-gradient(180deg, rgba(9,15,28,0.98) 0%, rgba(9,15,28,0.95) 100%)",
          borderRight: "1px solid rgba(51,65,85,0.3)",
          backdropFilter: "blur(24px)",
          position: "fixed",
          height: "100%",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(51,65,85,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #059669, #047857)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(5,150,105,0.4)",
              flexShrink: 0,
            }}>
              <School style={{ width: "18px", height: "18px", color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: "14px", color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                CT Blessed Fighter
              </h1>
              <p style={{ fontSize: "10px", color: "#475569", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px" }}>
                Gestão
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          <p style={{ fontSize: "9px", color: "#334155", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", padding: "8px 12px 6px" }}>
            Menu
          </p>
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#10b981" : "#64748b",
                background: isActive ? "rgba(5,150,105,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(5,150,105,0.15)" : "1px solid transparent",
                marginBottom: "2px",
                transition: "all 0.15s",
                textDecoration: "none",
                letterSpacing: "0.01em",
              })}
              className={({ isActive }) => isActive ? "" : "sidebar-link"}
            >
              {({ isActive }) => (
                <>
                  <item.icon style={{ width: "16px", height: "16px", flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <span className="nav-active-dot" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Access Control */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(51,65,85,0.25)" }}>
          <NavLink
            to="/access"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#34d399",
              background: "rgba(5,150,105,0.07)",
              border: "1px solid rgba(5,150,105,0.2)",
              transition: "all 0.15s",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            <Zap style={{ width: "15px", height: "15px", flexShrink: 0 }} />
            <span>Controle de Acesso</span>
          </NavLink>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "256px", minHeight: "100vh" }}>
        <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .sidebar-link:hover {
          color: #94a3b8 !important;
          background: rgba(51,65,85,0.2) !important;
        }
      `}</style>
    </div>
  );
}
