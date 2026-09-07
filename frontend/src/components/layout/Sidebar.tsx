import { HelpCircle, LayoutDashboard, Package, Upload, Warehouse } from "lucide-react";
import { NavLink } from "react-router-dom";

const ITENS_NAV = [
  { to: "/", label: "Upload", icone: Upload, fim: true },
  { to: "/dashboard", label: "Visão geral", icone: LayoutDashboard, fim: false },
  { to: "/produtos", label: "Produtos", icone: Package, fim: false },
  { to: "/ajuda", label: "Ajuda", icone: HelpCircle, fim: false },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Warehouse size={18} className="text-white" />
        </span>
        <span className="text-lg font-semibold text-slate-800">StockWise</span>
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
