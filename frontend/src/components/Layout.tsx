import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, CreditCard, ScanLine, School } from "lucide-react";

const nav = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Alunos", icon: Users },
  { path: "/enrollments", label: "Matrículas", icon: BookOpen },
  { path: "/payments", label: "Pagamentos", icon: CreditCard },
  { path: "/classrooms", label: "Turmas", icon: School },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800/60 flex flex-col backdrop-blur-xl fixed h-full z-20">
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-tight">Matrícula</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">Sistema de Gestão</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-brand-600/15 text-brand-400 border border-brand-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }>
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800/60">
          <NavLink to="/access" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all">
            <ScanLine className="w-[18px] h-[18px]" />
            Controle de Acesso
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 ml-64">
        <div className="p-8 max-w-[1400px] mx-auto"><Outlet /></div>
      </main>
    </div>
  );
}
