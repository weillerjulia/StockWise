import { HelpCircle, LayoutDashboard, Package, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";
import LogoSimbolo from "../LogoSimbolo";

const ITENS_NAV = [
  { to: "/", label: "Upload", icone: Upload, fim: true },
  { to: "/dashboard", label: "Visão geral", icone: LayoutDashboard, fim: false },
  { to: "/produtos", label: "Produtos", icone: Package, fim: false },
  { to: "/ajuda", label: "Ajuda", icone: HelpCircle, fim: false },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-6 py-6">
        <LogoSimbolo tamanho={36} className="shrink-0" />
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Stock<span className="text-blue-600">Wise</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {ITENS_NAV.map(({ to, label, icone: Icone, fim }) => (
          <NavLink
            key={to}
            to={to}
            end={fim}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-blue-100 font-semibold text-blue-700" : "font-medium text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <Icone size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
