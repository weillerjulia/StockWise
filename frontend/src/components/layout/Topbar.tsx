export default function Topbar({ titulo }: { titulo: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-blue-600" />
        <h1 className="text-xl font-bold text-slate-800">{titulo}</h1>
      </div>
    </header>
  );
}
