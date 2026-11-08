import type { ReactNode } from "react";

export default function Topbar({ titulo, extras }: { titulo: string; extras?: ReactNode }) {
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">{titulo}</h1>
        {extras && <div className="flex items-center gap-2">{extras}</div>}
      </div>
    </header>
  );
}
