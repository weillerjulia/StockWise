import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const TITULOS_POR_ROTA: Record<string, string> = {
  "/": "Importar estoque",
  "/dashboard": "Visão geral",
  "/produtos": "Produtos",
  "/ajuda": "Ajuda",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const titulo = TITULOS_POR_ROTA[location.pathname] ?? "StockWise";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar titulo={titulo} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
