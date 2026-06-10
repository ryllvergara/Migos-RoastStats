export function AuditReadyBanner() {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-500 p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 text-emerald-700">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </div>
        <span className="text-sm font-bold">Ready for Evening Audit!</span>
      </div>
    </div>
  );
}
