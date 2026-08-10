import { LayoutDashboard, Package, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";

const ITENS_NAV = [
  { to: "/", label: "Upload", icone: Upload, fim: true },
  { to: "/dashboard", label: "Visão geral", icone: LayoutDashboard, fim: false },
  { to: "/produtos", label: "Produtos", icone: Package, fim: false },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-6">
        <span className="text-lg font-semibold text-slate-800">StockWise</span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {ITENS_NAV.map(({ to, label, icone: Icone, fim }) => (
          <NavLink
            key={to}
            to={to}
            end={fim}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
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
