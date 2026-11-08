import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import { DefinirExtrasDoTituloContext } from "./ExtrasDoTitulo";
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
  const [extrasDoTitulo, setExtrasDoTitulo] = useState<ReactNode>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={titulo} extras={extrasDoTitulo} />
        <DefinirExtrasDoTituloContext.Provider value={setExtrasDoTitulo}>
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </DefinirExtrasDoTituloContext.Provider>
      </div>
    </div>
  );
}
