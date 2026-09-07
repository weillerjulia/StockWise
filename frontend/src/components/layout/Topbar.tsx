export default function Topbar({ titulo }: { titulo: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">{titulo}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
          US
        </span>
        <span className="text-sm font-medium text-slate-600">Usuário</span>
      </div>
    </header>
  );
}
