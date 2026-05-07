import { Eye, EyeOff } from 'lucide-react';
import { AuditLogItem, AuditLog } from './AuditLogItem';

interface AuditLogsSectionProps {
  logs: AuditLog[];
  showLogs: boolean;
  onToggle: () => void;
}

export function AuditLogsSection({ logs, showLogs, onToggle }: AuditLogsSectionProps) {
  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
            {showLogs ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </div>
          <span className="font-black text-gray-900 tracking-tight">Audit Logs for the Week</span>
        </div>
        <span className="text-xs font-bold text-[#D32F2F] uppercase tracking-widest">
          {logs.length} Total Logs
        </span>
      </button>

      {showLogs && (
        <div className="px-8 pb-8 space-y-4">
          {logs.map((log, i) => (
            <AuditLogItem key={i} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}